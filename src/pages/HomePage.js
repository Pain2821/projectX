import React from "react";
import HeroSection from "../components/hero/HeroSection";
import LiveMetricsBar from "../components/hero/LiveMetricsBar";
import ISSTrackerCard from "../components/dashboard/ISSTrackerCard";
import LaunchCountdownCard from "../components/dashboard/LaunchCountdownCard";
import SatellitesCard from "../components/dashboard/SatellitesCard";
import DebrisCard from "../components/dashboard/DebrisCard";
import MarsWeatherWidget from "../components/widgets/MarsWeatherWidget";
import SatelliteHeatmap from "../components/widgets/SatelliteHeatmap";
import DataInsights from "../components/insights/DataInsights";
import NewsRail from "../components/news/NewsRail";
import Footer from "../components/layout/Footer";

export default function HomePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary, #05070d)",
        overflowX: "hidden",
      }}
    >
      {/* Hero */}
      <HeroSection />

      {/* Live Metrics Strip */}
      <LiveMetricsBar />

      {/* Primary Dashboard Grid */}
      <section className="section" aria-label="Dashboard overview">
        <h2 className="section-title">Mission Dashboard</h2>
        <div className="dashboard-grid">
          <ISSTrackerCard />
          <LaunchCountdownCard />
          <SatellitesCard />
          <DebrisCard />
        </div>
      </section>

      {/* Live Widgets */}
      <section className="section" aria-label="Live data widgets">
        <h2 className="section-title">Live Data</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "var(--space-lg, 24px)",
          }}
          className="dashboard-grid"
        >
          <MarsWeatherWidget />
          <SatelliteHeatmap />
        </div>
      </section>

      {/* Data Insights */}
      <DataInsights />

      {/* News Rail */}
      <NewsRail />

      {/* Footer */}
      <Footer />
    </div>
  );
}
