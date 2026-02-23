import React from "react";
import MapView from "./components/MapView";
import StatusBar from "./components/StatusBar";
import { useIss } from "./common/hooks";
import AppWrapper, { IssProvider, ThemeProvider } from "./layouts/appWrapper";
import compose from "./layouts/compose";

function IssTracker() {
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

const Providers = compose(ThemeProvider, IssProvider, AppWrapper);

export default function App() {
  return (
    <Providers>
      <IssTracker />
    </Providers>
  );
}
