import React from "react";
import { Polyline } from "react-leaflet";

export default function OrbitPath({ history }) {
  if (!history || history.length < 2) {
    return null;
  }

  const segments = [];

  for (let i = 1; i < history.length; i += 1) {
    segments.push([
      [history[i - 1].latitude, history[i - 1].longitude],
      [history[i].latitude, history[i].longitude],
    ]);
  }

  return (
    <>
      {segments.map((segment, index) => {
        const progress = (index + 1) / segments.length;
        const glowOpacity = 0.04 + progress * 0.16;
        const lineOpacity = 0.1 + progress * 0.9;

        return (
          <React.Fragment key={`trail-${index}`}>
            <Polyline
              positions={segment}
              pathOptions={{
                color: "#22d3ee",
                weight: 8,
                opacity: glowOpacity,
              }}
            />
            <Polyline
              positions={segment}
              pathOptions={{
                color: "#38bdf8",
                weight: 2.6,
                opacity: lineOpacity,
              }}
            />
          </React.Fragment>
        );
      })}
    </>
  );
}
