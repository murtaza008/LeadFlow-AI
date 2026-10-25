// Public demo account: one shared login that "Try demo" signs every visitor
// into. Client-safe on purpose: no secrets here. The password lives only in
// the DEMO_PASSWORD env var and is read by server code.

export const DEMO_EMAIL = "demo@leadflow.demo";

/** Live Gemini calls (scoring + insights) the demo account may make per hour, shared by all visitors. */
export const DEMO_AI_CALLS_PER_HOUR = 10;

export const DEMO_BANNER_MESSAGE = "You're viewing a demo account. Data resets daily.";

export const DEMO_AI_LIMIT_MESSAGE = `The demo allows ${DEMO_AI_CALLS_PER_HOUR} live AI calls per hour, shared by everyone trying it, and they're used up for now. Every lead already has a stored AI score and insight, so keep exploring, or create a free account to run unlimited scoring on your own leads.`;

/** Email domains reserved for the demo accounts; nobody may sign up with them. */
export const DEMO_RESERVED_DOMAINS = ["leadflow.demo", "northwind.demo"];

export function isDemoEmail(email: string | null | undefined): boolean {
  return email?.trim().toLowerCase() === DEMO_EMAIL;
}

/** Friendly copy for an action the demo account can't take, e.g. demoBlockedMessage("Deleting leads"). */
export function demoBlockedMessage(action: string): string {
  return `${action} is turned off in the demo account so it stays intact for the next visitor. Create a free account to try it with your own data.`;
}

export class DemoLimitError extends Error {
  constructor(message = DEMO_AI_LIMIT_MESSAGE) {
    super(message);
    this.name = "DemoLimitError";
  }
}
