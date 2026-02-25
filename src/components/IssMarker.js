import React, { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import { Marker, Popup } from "react-leaflet";
import { easeInOut, normalizeLongitude, shortestLongitudeDelta } from "../common/utils";

const issIcon = L.divIcon({
  className: "iss-marker-icon",
  html: `
    <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="issGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feDropShadow dx="0" dy="0" stdDeviation="1.4" flood-color="#67e8f9" flood-opacity="0.9" />
        </filter>
      </defs>
      <g filter="url(#issGlow)">
        <rect x="3" y="12" width="7" height="6" rx="1" fill="#38bdf8"/>
        <rect x="20" y="12" width="7" height="6" rx="1" fill="#38bdf8"/>
        <rect x="10" y="11" width="10" height="8" rx="2" fill="#e2e8f0"/>
        <rect x="13" y="9" width="4" height="3" rx="1" fill="#cbd5e1"/>
      </g>
    </svg>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -14],
});

const DEFAULT_ANIMATION_MS = 1000;
const MIN_ANIMATION_MS = 350;
const MAX_ANIMATION_MS = 1400;

export default function IssMarker({ position }) {
  const markerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const initialPositionRef = useRef(null);
  const lastTimestampRef = useRef(null);

  const markerPosition = useMemo(() => {
    if (!position) {
      return null;
    }

    if (!initialPositionRef.current) {
      initialPositionRef.current = [position.latitude, position.longitude];
    }

    return initialPositionRef.current;
  }, [position]);

  useEffect(() => {
    if (!position || !markerRef.current) {
      return;
    }

    const marker = markerRef.current;
    const start = marker.getLatLng();
    const targetLatitude = position.latitude;
    const targetLongitude = position.longitude;
    const deltaLongitude = shortestLongitudeDelta(start.lng, targetLongitude);
    const nextTimestamp = Number(position.timestamp) || Date.now();
    const previousTimestamp = lastTimestampRef.current;
    const rawDuration = previousTimestamp ? nextTimestamp - previousTimestamp : DEFAULT_ANIMATION_MS;
    const durationMs = Math.min(MAX_ANIMATION_MS, Math.max(MIN_ANIMATION_MS, rawDuration));
    const startTime = performance.now();

    lastTimestampRef.current = nextTimestamp;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const animate = (currentTime) => {
      const progress = Math.min((currentTime - startTime) / durationMs, 1);
      const easedProgress = easeInOut(progress);
      const nextLatitude = start.lat + (targetLatitude - start.lat) * easedProgress;
      const nextLongitude = normalizeLongitude(start.lng + deltaLongitude * easedProgress);

      marker.setLatLng([nextLatitude, nextLongitude]);

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
  }, [position]);

  if (!position || !markerPosition) {
    return null;
  }

  return (
    <Marker ref={markerRef} position={markerPosition} icon={issIcon}>
      <Popup>International Space Station</Popup>
    </Marker>
  );
}
