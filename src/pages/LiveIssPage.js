import React from "react";
import MapView from "../components/MapView";
import StatusBar from "../components/StatusBar";
import { useIss } from "../common/hooks";

export default function LiveIssPage() {
  const { position, history, loading, error, lastUpdated } = useIss();

  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <MapView position={position} history={history} />
      <StatusBar
        position={position}
        loading={loading}
        error={error}
        lastUpdated={lastUpdated}
      />
    </div>
  );
}
