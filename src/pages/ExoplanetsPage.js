import React, { useEffect, useMemo, useState } from "react";
import { fetchExoplanets } from "../common/api";
import RocketLoader from "../components/RocketLoader";

const DISCOVERY_COLORS = {
  Transit: "#22d3ee",
  "Radial Velocity": "#f59e0b",
  Imaging: "#a78bfa",
  Microlensing: "#34d399",
  "Transit Timing Variations": "#f472b6",
  Astrometry: "#fb7185",
  "Pulsar Timing": "#60a5fa",
};

function formatNumber(value, digits = 2) {
  if (!Number.isFinite(value)) {
    return "--";
  }

  return value.toFixed(digits);
}

function useChartData(rawData) {
  return useMemo(() => {
    const points = (Array.isArray(rawData) ? rawData : [])
      .map((item) => ({
        id: `${item.pl_name || "planet"}-${item.hostname || "star"}`,
        planetName: item.pl_name || "Unknown",
        hostName: item.hostname || "Unknown",
        radiusEarth: Number(item.pl_rade),
        massEarth: Number(item.pl_bmasse),
        orbitalPeriod: Number(item.pl_orbper),
        discoveryYear: Number(item.disc_year),
        discoveryMethod: item.discoverymethod || "Other",
      }))
      .filter(
        (item) =>
          Number.isFinite(item.radiusEarth) &&
          Number.isFinite(item.massEarth) &&
          Number.isFinite(item.orbitalPeriod) &&
          item.massEarth > 0 &&
          item.orbitalPeriod > 0
      );

    const sorted = points.sort((a, b) => a.orbitalPeriod - b.orbitalPeriod).slice(0, 350);

    return sorted;
  }, [rawData]);
}

function BubbleChart({ data, selectedId, onSelect }) {
  const width = 1060;
  const height = 560;
  const padding = { top: 30, right: 28, bottom: 64, left: 84 };

  const xMin = Math.min(...data.map((d) => Math.log10(d.orbitalPeriod)));
  const xMax = Math.max(...data.map((d) => Math.log10(d.orbitalPeriod)));
  const yMin = Math.min(...data.map((d) => Math.log10(d.massEarth)));
  const yMax = Math.max(...data.map((d) => Math.log10(d.massEarth)));
  const rMin = Math.min(...data.map((d) => d.radiusEarth));
  const rMax = Math.max(...data.map((d) => d.radiusEarth));

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const xAt = (value) => {
    const v = Math.log10(value);
    const t = (v - xMin) / Math.max(0.0001, xMax - xMin);
    return padding.left + t * plotWidth;
  };

  const yAt = (value) => {
    const v = Math.log10(value);
    const t = (v - yMin) / Math.max(0.0001, yMax - yMin);
    return height - padding.bottom - t * plotHeight;
  };

  const rAt = (value) => {
    const t = (value - rMin) / Math.max(0.0001, rMax - rMin);
    return 4 + t * 20;
  };

  const xTicks = [0.1, 1, 10, 100, 1000].filter(
    (tick) => tick >= Math.pow(10, xMin) && tick <= Math.pow(10, xMax)
  );
  const yTicks = [0.1, 1, 10, 100, 1000, 10000].filter(
    (tick) => tick >= Math.pow(10, yMin) && tick <= Math.pow(10, yMax)
  );

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{
        width: "100%",
        height: "auto",
        borderRadius: "16px",
        border: "1px solid rgba(148, 163, 184, 0.22)",
        background:
          "radial-gradient(circle at 18% 12%, rgba(22, 53, 104, 0.35) 0%, rgba(4, 10, 24, 0.92) 46%, rgba(2, 6, 16, 1) 100%)",
      }}
      role="img"
      aria-label="Exoplanets bubble chart"
    >
      {xTicks.map((tick) => (
        <g key={`x-${tick}`}>
          <line
            x1={xAt(tick)}
            y1={padding.top}
            x2={xAt(tick)}
            y2={height - padding.bottom}
            stroke="rgba(148, 163, 184, 0.15)"
          />
          <text x={xAt(tick)} y={height - padding.bottom + 22} textAnchor="middle" fill="#cbd5e1" fontSize="12">
            {tick}
          </text>
        </g>
      ))}
      {yTicks.map((tick) => (
        <g key={`y-${tick}`}>
          <line
            x1={padding.left}
            y1={yAt(tick)}
            x2={width - padding.right}
            y2={yAt(tick)}
            stroke="rgba(148, 163, 184, 0.15)"
          />
          <text x={padding.left - 8} y={yAt(tick) + 4} textAnchor="end" fill="#cbd5e1" fontSize="12">
            {tick}
          </text>
        </g>
      ))}

      {data.map((item) => {
        const selected = selectedId === item.id;
        const color = DISCOVERY_COLORS[item.discoveryMethod] || "#38bdf8";

        return (
          <circle
            key={item.id}
            cx={xAt(item.orbitalPeriod)}
            cy={yAt(item.massEarth)}
            r={rAt(item.radiusEarth)}
            fill={color}
            fillOpacity={selected ? 0.95 : 0.68}
            stroke={selected ? "#e2e8f0" : "rgba(15, 23, 42, 0.7)"}
            strokeWidth={selected ? 2 : 1}
            style={{ cursor: "pointer" }}
            onClick={() => onSelect(item)}
          />
        );
      })}

      <text x={width / 2} y={height - 16} textAnchor="middle" fill="#e2e8f0" fontSize="13">
        Orbital Period (days, log scale)
      </text>
      <text
        x={20}
        y={height / 2}
        textAnchor="middle"
        transform={`rotate(-90 20 ${height / 2})`}
        fill="#e2e8f0"
        fontSize="13"
      >
        Planet Mass (Earth masses, log scale)
      </text>
    </svg>
  );
}

function DetailsPanel({ planet }) {
  if (!planet) {
    return (
      <aside
        style={{
          borderRadius: "14px",
          border: "1px solid rgba(124, 148, 183, 0.3)",
          background: "rgba(5, 10, 22, 0.72)",
          padding: "14px",
          color: "#9fb5d9",
          fontSize: "13px",
        }}
      >
        Click a bubble to inspect an exoplanet.
      </aside>
    );
  }

  return (
    <aside
      style={{
        borderRadius: "14px",
        border: "1px solid rgba(124, 148, 183, 0.3)",
        background: "rgba(5, 10, 22, 0.72)",
        padding: "14px",
        display: "grid",
        gap: "8px",
      }}
    >
      <h3 style={{ margin: 0, color: "#e2e8f0", fontSize: "20px" }}>{planet.planetName}</h3>
      <div style={{ color: "#9fb5d9", fontSize: "13px" }}>Host Star: {planet.hostName}</div>
      <div style={{ color: "#9fb5d9", fontSize: "13px" }}>Discovery Method: {planet.discoveryMethod}</div>
      <div style={{ color: "#9fb5d9", fontSize: "13px" }}>Discovery Year: {planet.discoveryYear || "--"}</div>
      <div style={{ color: "#dbeafe", fontSize: "14px" }}>Radius: {formatNumber(planet.radiusEarth)} Earth radii</div>
      <div style={{ color: "#dbeafe", fontSize: "14px" }}>Mass: {formatNumber(planet.massEarth)} Earth masses</div>
      <div style={{ color: "#dbeafe", fontSize: "14px" }}>Orbital Period: {formatNumber(planet.orbitalPeriod)} days</div>
    </aside>
  );
}

export default function ExoplanetsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rawData, setRawData] = useState([]);
  const [selectedPlanet, setSelectedPlanet] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadExoplanets() {
      try {
        const data = await fetchExoplanets({ signal: controller.signal });
        setRawData(Array.isArray(data) ? data : []);
        setError("");
      } catch (requestError) {
        if (controller.signal.aborted) {
          return;
        }
        setError(requestError.message || "Unable to load exoplanets.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadExoplanets();

    return () => controller.abort();
  }, []);

  const data = useChartData(rawData);

  useEffect(() => {
    if (!selectedPlanet && data.length > 0) {
      setSelectedPlanet(data[0]);
    }
  }, [data, selectedPlanet]);

  const legendMethods = useMemo(() => {
    const methods = new Set(data.map((d) => d.discoveryMethod));
    return Array.from(methods).slice(0, 8);
  }, [data]);

  return (
    <section
      style={{
        position: "fixed",
        inset: 0,
        overflowY: "auto",
        padding: "86px 16px 20px",
      }}
    >
      <div style={{ maxWidth: "1120px", margin: "0 auto", display: "grid", gap: "14px" }}>
        <header>
          <h1 style={{ margin: 0, color: "#e2e8f0", fontSize: "28px", lineHeight: 1.2 }}>Exoplanets</h1>
          <p style={{ margin: "8px 0 0", color: "#9fb5d9", fontSize: "13px" }}>
            Bubble chart: size = planet radius, color = discovery method, axes = orbital period and mass
          </p>
        </header>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", color: "#cbd5e1", fontSize: "12px" }}>
          {legendMethods.map((method) => (
            <div key={method} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "999px",
                  background: DISCOVERY_COLORS[method] || "#38bdf8",
                }}
              />
              {method}
            </div>
          ))}
        </div>

        {error ? <div style={{ color: "#fca5a5", fontSize: "14px" }}>{error}</div> : null}

        {!loading && !error ? (
          <>
            <BubbleChart
              data={data}
              selectedId={selectedPlanet?.id}
              onSelect={(planet) => setSelectedPlanet(planet)}
            />
            <DetailsPanel planet={selectedPlanet} />
          </>
        ) : null}
      </div>

      {loading ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "grid",
            placeItems: "center",
            background: "rgba(3, 7, 18, 0.5)",
            backdropFilter: "blur(2px)",
            zIndex: 1500,
          }}
        >
          <RocketLoader label="Mapping exoplanet systems..." />
        </div>
      ) : null}
    </section>
  );
}
