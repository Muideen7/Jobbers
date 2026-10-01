import { ImageResponse } from "next/og";

export const alt = "Jobbers — the AI job-matching agent";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Design tokens mirrored from app/globals.css. next/og renders in a sandbox
 * that cannot read the CSS custom properties, so the palette is repeated here.
 */
const INK = "#18181b";
const ACCENT = "#6e56cf";
const TEXT_SECONDARY = "#71717a";
const BORDER = "#e4e4e7";
const SURFACE_SECONDARY = "#f4f4f5";
const PEACH = "#fff6ec";
const ACCENT_LIGHT = "#eeeafc";

function Sunburst({ size: px, color }: { size: number; color: string }) {
  const rays = [
    [16, 6.5, 16, 10],
    [16, 22, 16, 25.5],
    [6.5, 16, 10, 16],
    [22, 16, 25.5, 16],
    [9.3, 9.3, 11.8, 11.8],
    [20.2, 20.2, 22.7, 22.7],
    [9.3, 22.7, 11.8, 20.2],
    [20.2, 11.8, 22.7, 9.3],
  ] as const;

  return (
    <svg width={px} height={px} viewBox="0 0 32 32" fill="none">
      <g stroke={color} strokeWidth={2.6} strokeLinecap="round">
        {rays.map(([x1, y1, x2, y2]) => (
          <line key={`${x1}-${y1}-${x2}-${y2}`} x1={x1} y1={y1} x2={x2} y2={y2} />
        ))}
      </g>
    </svg>
  );
}

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: `linear-gradient(135deg, ${ACCENT_LIGHT} 0%, #fafafa 45%, ${PEACH} 100%)`,
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              borderRadius: 18,
              background: INK,
            }}
          >
            <Sunburst size={40} color="#ffffff" />
          </div>
          <div
            style={{
              fontSize: 44,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: INK,
            }}
          >
            Jobbers
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              display: "flex",
              fontSize: 68,
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: "-0.03em",
              color: INK,
              maxWidth: 940,
            }}
          >
            Stop scrolling job boards.
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 32,
              lineHeight: 1.4,
              color: TEXT_SECONDARY,
              maxWidth: 900,
            }}
          >
            Jobbers scores every open role against your profile, researches the
            company, and tailors your application.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {["Match scoring", "Company research", "Tailored resumes"].map(
            (label) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  padding: "12px 22px",
                  borderRadius: 999,
                  background: "#ffffff",
                  border: `1px solid ${BORDER}`,
                  fontSize: 22,
                  color: INK,
                }}
              >
                {label}
              </div>
            ),
          )}
        </div>

        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 10,
            display: "flex",
            background: `linear-gradient(90deg, ${ACCENT} 0%, ${ACCENT} 40%, ${SURFACE_SECONDARY} 100%)`,
          }}
        />
      </div>
    ),
    size,
  );
}