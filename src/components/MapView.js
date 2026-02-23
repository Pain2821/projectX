import React, { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import DayNightOverlay from "./DayNightOverlay";
import IssMarker from "./IssMarker";
import OrbitPath from "./OrbitPath";

function TrackIssView({ position }) {
  const map = useMap();

  useEffect(() => {
    if (!position) {
      return;
    }

    map.flyTo([position.latitude, position.longitude], map.getZoom(), {
      animate: true,
      duration: 1.5,
    });
  }, [map, position]);

  return null;
}

export default function MapView({ position, history }) {
  const initialCenter = position
    ? [position.latitude, position.longitude]
    : [0, 0];

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
