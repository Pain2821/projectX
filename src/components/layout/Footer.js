import React from "react";
import { Link } from "react-router-dom";

const FOOTER_NAV = [
  { to: "/liveiss", label: "ISS Tracker" },
  { to: "/satellites", label: "Satellites" },
  { to: "/launches", label: "Launches" },
  { to: "/mars", label: "Mars Weather" },
  { to: "/exoplanets", label: "Exoplanets" },
  { to: "/debris", label: "Orbital Debris" },
];

const DATA_SOURCES = [
  { label: "NASA", url: "https://www.nasa.gov" },
  { label: "SpaceX", url: "https://www.spacex.com" },
  { label: "ESA", url: "https://www.esa.int" },
  { label: "Open Notify", url: "http://open-notify.org" },
  { label: "CelesTrak", url: "https://celestrak.org" },
];

export default function Footer() {
  const linkStyle = {
    color: "var(--text-secondary, #9aa4b2)",
    textDecoration: "none",
    fontSize: "14px",
    transition: "color var(--transition-fast, 150ms ease)",
    display: "block",
    padding: "3px 0",
  };

  return (
    <footer
      style={{
        borderTop: "1px solid var(--border, rgba(255,255,255,0.08))",
        background: "var(--bg-secondary, #0c1020)",
        padding: "var(--space-xxl, 64px) var(--space-lg, 24px) var(--space-lg, 24px)",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "var(--space-xl, 40px)",
        }}
        className="footer-grid"
      >
        {/* Column 1: Brand */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "var(--space-md, 16px)",
            }}
          >
            <span style={{ fontSize: "20px" }}>🛰</span>
            <span
              style={{
                fontFamily: "var(--font-heading, 'Space Grotesk', sans-serif)",
                fontSize: "18px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                color: "var(--text-primary, #e6edf3)",
              }}
            >
              OrbitWatch
            </span>
          </div>
          <p
            style={{
              color: "var(--text-secondary, #9aa4b2)",
              fontSize: "13px",
              lineHeight: 1.7,
            }}
          >
            Real-time orbital data using public APIs from NASA, ESA, CelesTrak,
            and other space agencies.
          </p>
        </div>

        {/* Column 2: Navigation */}
        <div>
          <h4
            style={{
              fontFamily: "var(--font-heading, 'Space Grotesk', sans-serif)",
              fontSize: "13px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--text-muted, #5a6577)",
              marginBottom: "var(--space-md, 16px)",
            }}
          >
            Navigation
          </h4>
          {FOOTER_NAV.map((item) => (
            <Link key={item.to} to={item.to} style={linkStyle}>
              {item.label}
            </Link>
          ))}
        </div>

        {/* Column 3: Data Sources */}
        <div>
          <h4
            style={{
              fontFamily: "var(--font-heading, 'Space Grotesk', sans-serif)",
              fontSize: "13px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--text-muted, #5a6577)",
              marginBottom: "var(--space-md, 16px)",
            }}
          >
            Data Sources
          </h4>
          {DATA_SOURCES.map((item) => (
            <a
              key={item.label}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              style={linkStyle}
            >
              {item.label} ↗
            </a>
          ))}
        </div>

        {/* Column 4: System */}
        <div>
          <h4
            style={{
              fontFamily: "var(--font-heading, 'Space Grotesk', sans-serif)",
              fontSize: "13px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--text-muted, #5a6577)",
              marginBottom: "var(--space-md, 16px)",
            }}
          >
            System
          </h4>
          <div style={{ ...linkStyle, display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "var(--success, #34d399)",
                boxShadow: "0 0 6px rgba(52,211,153,0.4)",
                display: "inline-block",
              }}
            />
            API Status: Online
          </div>
          <div style={linkStyle}>Server Uptime: 99.9%</div>
          <a href="#" style={linkStyle}>Documentation</a>
          <a href="#" style={linkStyle}>Contact</a>
        </div>
      </div>

      {/* Bottom Bar */}
      <div
        style={{
          marginTop: "var(--space-xl, 40px)",
          paddingTop: "var(--space-lg, 24px)",
          borderTop: "1px solid var(--border, rgba(255,255,255,0.08))",
          maxWidth: "1280px",
          margin: "var(--space-xl, 40px) auto 0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "var(--space-md, 16px)",
        }}
      >
        <span
          style={{
            fontSize: "13px",
            color: "var(--text-muted, #5a6577)",
          }}
        >
          © 2026 OrbitWatch. All rights reserved.
        </span>
        <div style={{ display: "flex", gap: "var(--space-md, 16px)" }}>
          <a
            href="#"
            style={{ color: "var(--text-secondary, #9aa4b2)", textDecoration: "none", fontSize: "13px" }}
          >
            Twitter
          </a>
          <a
            href="#"
            style={{ color: "var(--text-secondary, #9aa4b2)", textDecoration: "none", fontSize: "13px" }}
          >
            GitHub
          </a>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 480px) {
          .footer-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer>
  );
}
