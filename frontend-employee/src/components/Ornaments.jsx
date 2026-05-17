import React from "react";
import { theme } from "../theme";

export function GoldOrnament({ size = 40, opacity = 0.14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" style={{ opacity }}>
      <g fill="none" stroke={theme.accent} strokeWidth="0.7">
        <circle cx="20" cy="20" r="18" />
        <path d="M20 2 L22 20 L20 38 L18 20 Z" />
        <path d="M2 20 L20 18 L38 20 L20 22 Z" />
        <path d="M7.3 7.3 L20 20 L32.7 32.7 M7.3 32.7 L20 20 L32.7 7.3" />
      </g>
    </svg>
  );
}

export function IslamicPattern({ opacity = 0.05 }) {
  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="zellige" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
          <path
            d="M30 0 L60 30 L30 60 L0 30 Z M30 15 L45 30 L30 45 L15 30 Z"
            fill="none"
            stroke={theme.accent}
            strokeWidth="0.5"
          />
          <circle cx="30" cy="30" r="4" fill="none" stroke={theme.accent} strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#zellige)" />
    </svg>
  );
}
