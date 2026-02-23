import React, { useMemo } from "react";
import { Polyline } from "react-leaflet";

function OrbitPath({ history }) {
  const segments = useMemo(() => {
    if (!history || history.length < 2) {
      return [];
    }

    const points = [];
    for (let i = 1; i < history.length; i += 1) {
      points.push([
        [history[i - 1].latitude, history[i - 1].longitude],
        [history[i].latitude, history[i].longitude],
      ]);
    }

    return points;
  }, [history]);

  if (segments.length === 0) {
    return null;
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

export default React.memo(OrbitPath);
