import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** The LeadFlow mark: three bars getting shorter (a ranked list) on ochre. */
export default function Icon() {
  const bar = (width: number, opacity: number) => (
    <div style={{ width, height: 4, borderRadius: 2, background: "#ffffff", opacity }} />
  );
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 3,
          paddingLeft: 7,
          background: "#8a5d00",
          borderRadius: 8,
        }}
      >
        {bar(18, 1)}
        {bar(13, 0.85)}
        {bar(8, 0.7)}
      </div>
    ),
    { ...size },
  );
}
