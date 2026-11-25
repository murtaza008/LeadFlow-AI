import { afterEach, describe, expect, it, vi } from "vitest";
import { APICallError } from "ai";
import { fallbackMiddleware, isOverloaded } from "@/lib/gemini";

vi.mock("@/lib/session", async () => (await import("./helpers")).sessionMock);
vi.mock("@/lib/workspace", async () => (await import("./helpers")).workspaceMock);
vi.mock("@/lib/generated/prisma/client", async () => (await import("./helpers")).prismaClientMock);

const apiError = (statusCode: number) =>
  new APICallError({ message: `HTTP ${statusCode}`, url: "https://example.test", requestBodyValues: {}, statusCode });

type Mw = ReturnType<typeof fallbackMiddleware>;
type GenerateArgs = Parameters<NonNullable<Mw["wrapGenerate"]>>[0];

/** A fake model: doGenerate behaves as given, with the call options it received. */
function fakeModel(doGenerate: (opts: { abortSignal?: AbortSignal }) => Promise<unknown>) {
  return { doGenerate: vi.fn(doGenerate), doStream: vi.fn() };
}
const call = (mw: Mw, primary: ReturnType<typeof fakeModel>, abortSignal?: AbortSignal) =>
  mw.wrapGenerate!({
    doGenerate: vi.fn(),
    doStream: vi.fn(),
    params: { prompt: [], abortSignal },
    model: primary,
  } as unknown as GenerateArgs);

/** Never answers until aborted, like Google holding a request before replying "busy". */
const hangs = (opts: { abortSignal?: AbortSignal }) =>
  new Promise((_, reject) => opts.abortSignal?.addEventListener("abort", () => reject(opts.abortSignal?.reason)));

afterEach(() => vi.restoreAllMocks());

describe("isOverloaded", () => {
  it("is true for overload, rate-limit and server errors only", () => {
    expect(isOverloaded(apiError(503))).toBe(true);
    expect(isOverloaded(apiError(429))).toBe(true);
    expect(isOverloaded(apiError(500))).toBe(true);
    expect(isOverloaded(apiError(400))).toBe(false);
    expect(isOverloaded(apiError(404))).toBe(false);
    expect(isOverloaded(new Error("network"))).toBe(false);
  });
});

describe("fallbackMiddleware (lead scoring, insights, daily focus)", () => {
  it("uses the main model when it answers", async () => {
    const fallback = fakeModel(async () => "fallback-result");
    const result = await call(fallbackMiddleware(fallback as never), fakeModel(async () => "primary-result"));
    expect(result).toBe("primary-result");
    expect(fallback.doGenerate).not.toHaveBeenCalled();
  });

  it("switches to the fallback when Google says the model is busy (503) or rate-limited (429)", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    for (const status of [503, 429]) {
      const fallback = fakeModel(async () => "fallback-result");
      const result = await call(fallbackMiddleware(fallback as never), fakeModel(async () => Promise.reject(apiError(status))));
      expect(result).toBe("fallback-result");
      expect(fallback.doGenerate).toHaveBeenCalledOnce();
    }
  });

  it("switches to the fallback when the main model is too slow", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const fallback = fakeModel(async () => "fallback-result");
    const started = Date.now();
    const result = await call(fallbackMiddleware(fallback as never, 50), fakeModel(hangs));
    expect(result).toBe("fallback-result");
    expect(Date.now() - started).toBeLessThan(1000);
  });

  it("does not hide real errors such as a bad request", async () => {
    const fallback = fakeModel(async () => "fallback-result");
    await expect(
      call(fallbackMiddleware(fallback as never), fakeModel(async () => Promise.reject(apiError(400)))),
    ).rejects.toThrow("HTTP 400");
    expect(fallback.doGenerate).not.toHaveBeenCalled();
  });

  it("respects a cancel from the caller instead of falling back", async () => {
    const fallback = fakeModel(async () => "fallback-result");
    const user = new AbortController();
    const pending = call(fallbackMiddleware(fallback as never, 5_000), fakeModel(hangs), user.signal);
    user.abort(new Error("stopped by user"));
    await expect(pending).rejects.toThrow("stopped by user");
    expect(fallback.doGenerate).not.toHaveBeenCalled();
  });
});

describe("handleApiError for Gemini errors", () => {
  it("says Gemini is busy when both models are overloaded, and shows real errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { handleApiError } = await import("@/lib/handle-error");
    const busy = handleApiError(apiError(503));
    expect(busy.status).toBe(503);
    expect((await busy.json()).error).toMatch(/busy/);
    const bad = handleApiError(apiError(400));
    expect(bad.status).toBe(502);
    expect((await bad.json()).error).toMatch(/400/);
  });
});
