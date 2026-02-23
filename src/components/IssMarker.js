import React from "react";
import L from "leaflet";
import { Marker, Popup } from "react-leaflet";

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

export default function IssMarker({ position }) {
  if (!position) {
    return null;
  }

  return (
    <Marker position={[position.latitude, position.longitude]} icon={issIcon}>
      <Popup>International Space Station</Popup>
    </Marker>
  );
}
