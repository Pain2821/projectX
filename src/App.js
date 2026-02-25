import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import TopNav from "./components/TopNav";
import {
  ExoplanetsPage,
  HomePage,
  LaunchesPage,
  LiveIssPage,
  MarsWeatherPage,
  OrbitalDebrisPage,
  SatellitesPage,
  SpaceNewsPage,
} from "./pages";
import AppWrapper, { IssProvider, ThemeProvider } from "./layouts/appWrapper";

export default function App() {
  return (
    <ThemeProvider>
      <AppWrapper>
        <BrowserRouter>
          <TopNav />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/liveiss"
              element={
                <IssProvider>
                  <LiveIssPage />
                </IssProvider>
              }
            />
            <Route path="/satellites" element={<SatellitesPage />} />
            <Route path="/news" element={<SpaceNewsPage />} />
            <Route path="/launches" element={<LaunchesPage />} />
            <Route path="/mars" element={<MarsWeatherPage />} />
            <Route path="/exoplanets" element={<ExoplanetsPage />} />
            <Route path="/debris" element={<OrbitalDebrisPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AppWrapper>
    </ThemeProvider>
  );
}
