import React, { useEffect, useMemo, useRef, useState } from "react";
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

function formatAxisTick(value) {
  if (value >= 1000) {
    return `${Math.round(value)}`;
  }
  if (value >= 10) {
    return `${Math.round(value)}`;
  }
  if (value >= 1) {
    return value.toFixed(1).replace(/\.0$/, "");
  }
  return value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function hashSeed(input) {
  let hash = 0;
  const text = String(input || "");

  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash);
}

function jitterOffset(id, axis) {
  const seed = hashSeed(`${id}-${axis}`);
  return (seed % 1000) / 1000 - 0.5;
}

function clampDomain(min, max, globalMin, globalMax, minSpan) {
  const globalSpan = globalMax - globalMin;
  let nextMin = min;
  let nextMax = max;
  let span = nextMax - nextMin;

  if (span < minSpan) {
    const center = (nextMin + nextMax) / 2;
    nextMin = center - minSpan / 2;
    nextMax = center + minSpan / 2;
    span = minSpan;
  }

  if (span > globalSpan) {
    return [globalMin, globalMax];
  }

  if (nextMin < globalMin) {
    nextMax += globalMin - nextMin;
    nextMin = globalMin;
  }
  if (nextMax > globalMax) {
    nextMin -= nextMax - globalMax;
    nextMax = globalMax;
  }

  return [nextMin, nextMax];
}

function buildLogTicks(domainMin, domainMax) {
  const ticks = [];
  const startPower = Math.floor(domainMin) - 1;
  const endPower = Math.ceil(domainMax) + 1;
  const multipliers = [1, 2, 5];

  for (let power = startPower; power <= endPower; power += 1) {
    for (const m of multipliers) {
      const value = m * Math.pow(10, power);
      const logValue = Math.log10(value);
      if (logValue >= domainMin && logValue <= domainMax) {
        ticks.push(value);
      }
    }
  }

  return Array.from(new Set(ticks)).sort((a, b) => a - b);
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
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div
        style={{
          borderRadius: "14px",
          border: "1px solid rgba(124, 148, 183, 0.3)",
          background: "rgba(5, 10, 22, 0.72)",
          color: "#9fb5d9",
          fontSize: "14px",
          padding: "24px",
        }}
      >
        No exoplanet records available for chart rendering.
      </div>
    );
  }

  const width = 1060;
  const height = 560;
  const padding = { top: 30, right: 28, bottom: 64, left: 84 };

  const xMin = Math.min(...data.map((d) => Math.log10(d.orbitalPeriod)));
  const xMax = Math.max(...data.map((d) => Math.log10(d.orbitalPeriod)));
  const yMin = Math.min(...data.map((d) => Math.log10(d.massEarth)));
  const yMax = Math.max(...data.map((d) => Math.log10(d.massEarth)));
  const rMin = Math.min(...data.map((d) => d.radiusEarth));
  const rMax = Math.max(...data.map((d) => d.radiusEarth));
  const svgRef = useRef(null);
  const [viewDomain, setViewDomain] = useState({ xMin, xMax, yMin, yMax });
  const [dragState, setDragState] = useState(null);
  const [hoverState, setHoverState] = useState(null);

  useEffect(() => {
    setViewDomain({ xMin, xMax, yMin, yMax });
  }, [xMin, xMax, yMin, yMax]);

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const xAt = (value) => {
    const v = Math.log10(value);
    const t = (v - viewDomain.xMin) / Math.max(0.0001, viewDomain.xMax - viewDomain.xMin);
    return padding.left + t * plotWidth;
  };

  const yAt = (value) => {
    const v = Math.log10(value);
    const t = (v - viewDomain.yMin) / Math.max(0.0001, viewDomain.yMax - viewDomain.yMin);
    return height - padding.bottom - t * plotHeight;
  };

  const rAt = (value) => {
    const t = (value - rMin) / Math.max(0.0001, rMax - rMin);
    return 4 + t * 20;
  };

  const xTicks = buildLogTicks(viewDomain.xMin, viewDomain.xMax);
  const yTicks = buildLogTicks(viewDomain.yMin, viewDomain.yMax);

  function updateHover(item, event) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }
    setHoverState({
      item,
      left: event.clientX - rect.left + 12,
      top: event.clientY - rect.top - 12,
    });
  }

  function handleWheel(event) {
    event.preventDefault();
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    const px = ((event.clientX - rect.left) / rect.width) * width;
    const py = ((event.clientY - rect.top) / rect.height) * height;
    if (px < padding.left || px > width - padding.right || py < padding.top || py > height - padding.bottom) {
      return;
    }

    const zoomFactor = event.deltaY > 0 ? 1.12 : 0.88;
    const xSpan = viewDomain.xMax - viewDomain.xMin;
    const ySpan = viewDomain.yMax - viewDomain.yMin;
    const xAnchor = viewDomain.xMin + ((px - padding.left) / plotWidth) * xSpan;
    const yAnchor = viewDomain.yMax - ((py - padding.top) / plotHeight) * ySpan;

    const nextXMin = xAnchor + (viewDomain.xMin - xAnchor) * zoomFactor;
    const nextXMax = xAnchor + (viewDomain.xMax - xAnchor) * zoomFactor;
    const nextYMin = yAnchor + (viewDomain.yMin - yAnchor) * zoomFactor;
    const nextYMax = yAnchor + (viewDomain.yMax - yAnchor) * zoomFactor;

    const [clampedXMin, clampedXMax] = clampDomain(nextXMin, nextXMax, xMin, xMax, 0.2);
    const [clampedYMin, clampedYMax] = clampDomain(nextYMin, nextYMax, yMin, yMax, 0.2);

    setViewDomain({
      xMin: clampedXMin,
      xMax: clampedXMax,
      yMin: clampedYMin,
      yMax: clampedYMax,
    });
  }

  function handleMouseDown(event) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    const px = ((event.clientX - rect.left) / rect.width) * width;
    const py = ((event.clientY - rect.top) / rect.height) * height;
    if (px < padding.left || px > width - padding.right || py < padding.top || py > height - padding.bottom) {
      return;
    }

    setDragState({
      startX: event.clientX,
      startY: event.clientY,
      xMin: viewDomain.xMin,
      xMax: viewDomain.xMax,
      yMin: viewDomain.yMin,
      yMax: viewDomain.yMax,
    });
  }

  function handleMouseMove(event) {
    if (!dragState) {
      return;
    }

    const dx = event.clientX - dragState.startX;
    const dy = event.clientY - dragState.startY;
    const xSpan = dragState.xMax - dragState.xMin;
    const ySpan = dragState.yMax - dragState.yMin;
    const shiftedXMin = dragState.xMin - (dx / plotWidth) * xSpan;
    const shiftedXMax = dragState.xMax - (dx / plotWidth) * xSpan;
    const shiftedYMin = dragState.yMin + (dy / plotHeight) * ySpan;
    const shiftedYMax = dragState.yMax + (dy / plotHeight) * ySpan;
    const [clampedXMin, clampedXMax] = clampDomain(shiftedXMin, shiftedXMax, xMin, xMax, 0.2);
    const [clampedYMin, clampedYMax] = clampDomain(shiftedYMin, shiftedYMax, yMin, yMax, 0.2);

    setViewDomain({
      xMin: clampedXMin,
      xMax: clampedXMax,
      yMin: clampedYMin,
      yMax: clampedYMax,
    });
  }

  function handleMouseUp() {
    setDragState(null);
  }

  const resetView = () => {
    setViewDomain({ xMin, xMax, yMin, yMax });
  };

  return (
    <div style={{ position: "relative", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
      <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      style={{
        width: "100%",
        height: "auto",
        borderRadius: "16px",
        border: "1px solid rgba(148, 163, 184, 0.22)",
        background:
          "radial-gradient(circle at 18% 12%, rgba(22, 53, 104, 0.35) 0%, rgba(4, 10, 24, 0.92) 46%, rgba(2, 6, 16, 1) 100%)",
        cursor: dragState ? "grabbing" : "grab",
      }}
      role="img"
      aria-label="Exoplanets bubble chart"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDoubleClick={resetView}
      onMouseLeave={() => {
        handleMouseUp();
        setHoverState(null);
      }}
    >
      <defs>
        <clipPath id="exoplanetPlotClip">
          <rect
            x={padding.left}
            y={padding.top}
            width={plotWidth}
            height={plotHeight}
          />
        </clipPath>
      </defs>
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
            {formatAxisTick(tick)}
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
            {formatAxisTick(tick)}
          </text>
        </g>
      ))}

      <g clipPath="url(#exoplanetPlotClip)">
      {data.map((item) => {
        const selected = selectedId === item.id;
        const color = DISCOVERY_COLORS[item.discoveryMethod] || "#38bdf8";
        const jitterX = jitterOffset(item.id, "x") * 8;
        const jitterY = jitterOffset(item.id, "y") * 8;
        const cx = xAt(item.orbitalPeriod) + jitterX;
        const cy = yAt(item.massEarth) + jitterY;

        return (
          <circle
            key={item.id}
            cx={cx}
            cy={cy}
            r={rAt(item.radiusEarth)}
            fill={color}
            fillOpacity={selected ? 0.95 : 0.68}
            stroke={selected ? "#e2e8f0" : "rgba(15, 23, 42, 0.7)"}
            strokeWidth={selected ? 2 : 1}
            style={{ cursor: "pointer" }}
            onClick={() => onSelect(item)}
            onMouseEnter={(event) => updateHover(item, event)}
            onMouseMove={(event) => updateHover(item, event)}
            onMouseLeave={() => setHoverState(null)}
          />
        );
      })}
      </g>

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
      <text x={width - padding.right} y={18} textAnchor="end" fill="#9fb5d9" fontSize="12">
        Drag to pan | Scroll to zoom | Double-click reset
      </text>
      <rect
        x={width - padding.right - 98}
        y={24}
        width={90}
        height={24}
        rx={6}
        fill="rgba(8, 23, 44, 0.8)"
        stroke="rgba(148, 163, 184, 0.45)"
        onClick={resetView}
        onDoubleClick={resetView}
        style={{ cursor: "pointer" }}
      />
      <text
        x={width - padding.right - 53}
        y={40}
        textAnchor="middle"
        fill="#e2e8f0"
        fontSize="12"
        style={{ pointerEvents: "none" }}
      >
        Reset View
      </text>
      </svg>
      {hoverState ? (
        <div
          style={{
            position: "absolute",
            left: `${Math.min(hoverState.left, 760)}px`,
            top: `${Math.max(hoverState.top, 8)}px`,
            pointerEvents: "none",
            background: "rgba(3, 10, 24, 0.94)",
            border: "1px solid rgba(148, 163, 184, 0.45)",
            borderRadius: "10px",
            padding: "8px 10px",
            color: "#e2e8f0",
            fontSize: "12px",
            display: "grid",
            gap: "3px",
            width: "min(230px, calc(100vw - 40px))",
            boxShadow: "0 6px 22px rgba(0, 0, 0, 0.35)",
            boxSizing: "border-box",
          }}
        >
          <strong style={{ fontSize: "13px" }}>{hoverState.item.planetName}</strong>
          <div>Host: {hoverState.item.hostName}</div>
          <div>Mass: {formatNumber(hoverState.item.massEarth)} Earth masses</div>
          <div>Radius: {formatNumber(hoverState.item.radiusEarth)} Earth radii</div>
          <div>Period: {formatNumber(hoverState.item.orbitalPeriod)} days</div>
          <div>Discovery Year: {hoverState.item.discoveryYear || "--"}</div>
        </div>
      ) : null}
    </div>
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
        padding: "86px max(12px, env(safe-area-inset-right)) 20px max(12px, env(safe-area-inset-left))",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "1120px", margin: "0 auto", display: "grid", gap: "14px" }}>
        <header>
          <h1 style={{ margin: 0, color: "#e2e8f0", fontSize: "28px", lineHeight: 1.2 }}>Exoplanets</h1>
          <p style={{ margin: "8px 0 0", color: "#9fb5d9", fontSize: "13px" }}>
            Bubble chart: size = planet radius, color = discovery method, axes = orbital period and mass
          </p>
          {!loading && data.length > 0 ? (
            <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "2px" }}>
              Showing {data.length.toLocaleString()} of {rawData.length.toLocaleString()} exoplanets
            </div>
          ) : null}
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
