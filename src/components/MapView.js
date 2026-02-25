import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { easeInOut, normalizeLongitude, shortestLongitudeDelta } from "../common/utils";
import DayNightOverlay from "./DayNightOverlay";
import IssMarker from "./IssMarker";
import OrbitPath from "./OrbitPath";

function TrackIssView({ position }) {
  const map = useMap();
  const animationFrameRef = useRef(null);

  useEffect(() => {
    if (!position) {
      return;
    }

    const startCenter = map.getCenter();
    const targetLatitude = position.latitude;
    const targetLongitude = normalizeLongitude(position.longitude);
    const deltaLongitude = shortestLongitudeDelta(startCenter.lng, targetLongitude);
    const durationMs = 1000;
    const startTime = performance.now();

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const animate = (currentTime) => {
      const progress = Math.min((currentTime - startTime) / durationMs, 1);
      const easedProgress = easeInOut(progress);
      const nextLatitude = startCenter.lat + (targetLatitude - startCenter.lat) * easedProgress;
      const nextLongitude = normalizeLongitude(startCenter.lng + deltaLongitude * easedProgress);

      map.setView([nextLatitude, nextLongitude], map.getZoom(), { animate: false });

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [map, position]);

  return null;
}

export default function MapView({ position, history }) {
  const initialCenter = position ? [position.latitude, position.longitude] : [0, 0];

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
      }}
    >
      <MapContainer
        center={initialCenter}
        zoom={3}
        minZoom={2}
        style={{ height: "100%", width: "100%" }}
        worldCopyJump
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
        />
        <DayNightOverlay />
        <OrbitPath history={history} />
        <IssMarker position={position} />
        <TrackIssView position={position} />
      </MapContainer>
    </div>
  );
}
