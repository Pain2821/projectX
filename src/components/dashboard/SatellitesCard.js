import React, { useEffect, useState } from "react";
import { fetchCatalog } from "../../common/api";
import WidgetCard from "./WidgetCard";

export default function SatellitesCard() {
  const [totalActive, setTotalActive] = useState(null);

  useEffect(() => {
    let disposed = false;

    async function loadTotal() {
      try {
        const payload = await fetchCatalog({ limit: 1, offset: 0 });
        if (!disposed) {
          setTotalActive(payload.total);
        }
      } catch (_error) {
        if (!disposed) {
          setTotalActive(null);
        }
      }
    }

    loadTotal();
  }, []);

  return (
    <WidgetCard
      title="Satellites"
      icon="SAT"
      ctaText="Explore"
      ctaTo="/satellites"
      accentColor="var(--accent-soft, #00aaff)"
    >
      <div style={{ marginBottom: "20px" }}>
        <div
          style={{
            fontSize: "36px",
            fontWeight: 700,
            fontFamily: "var(--font-heading, 'Space Grotesk', sans-serif)",
            color: "var(--text-primary, #e6edf3)",
            lineHeight: 1,
          }}
        >
          {Number.isFinite(totalActive) ? totalActive.toLocaleString() : "--"}
        </div>
        <div
          style={{
            fontSize: "12px",
            color: "var(--text-secondary, #9aa4b2)",
            marginTop: "4px",
          }}
        >
          Objects in Unified Catalog
        </div>
      </div>

      <div
        style={{
          background: "rgba(5,7,13,0.5)",
          borderRadius: "var(--radius-md, 10px)",
          padding: "12px 16px",
          border: "1px solid var(--border, rgba(255,255,255,0.08))",
        }}
      >
        <div style={{ fontSize: "13px", color: "var(--text-secondary, #9aa4b2)" }}>
          Includes payloads, debris, and rocket bodies from merged providers.
        </div>
      </div>
    </WidgetCard>
  );
}
