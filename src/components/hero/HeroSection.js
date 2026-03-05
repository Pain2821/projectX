import React from "react";
import { Link } from "react-router-dom";
import LiveMetricsBar from "./LiveMetricsBar";

export default function HeroSection() {
  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        padding: "140px 24px 60px",
        minHeight: "520px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Starfield background */}
      <div className="starfield" style={{ position: "absolute", inset: 0, zIndex: 0 }} />

      {/* Gradient overlays */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          background: `
            radial-gradient(ellipse at 20% 50%, rgba(45,226,230,0.07) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, rgba(0,170,255,0.05) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 100%, rgba(100,60,255,0.04) 0%, transparent 40%)
          `,
        }}
      />

      {/* Orbit ring decoration */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "700px",
          height: "700px",
          transform: "translate(-50%, -50%)",
          border: "1px solid rgba(45,226,230,0.06)",
          borderRadius: "50%",
          animation: "orbit-rotate 60s linear infinite",
          zIndex: 1,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-4px",
            left: "50%",
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "var(--accent, #2de2e6)",
            boxShadow: "0 0 12px rgba(45,226,230,0.6)",
          }}
        />
      </div>

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          textAlign: "center",
          maxWidth: "720px",
          animation: "fadeInUp 600ms ease",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-heading, 'Space Grotesk', sans-serif)",
            fontSize: "clamp(2rem, 5vw, 3.5rem)",
            fontWeight: 700,
            lineHeight: 1.15,
            marginBottom: "20px",
            background: "linear-gradient(135deg, #ffffff 0%, #2de2e6 50%, #00aaff 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Track Humanity's Presence in Space
        </h1>

        <p
          style={{
            fontSize: "clamp(1rem, 1.5vw, 1.125rem)",
            color: "var(--text-secondary, #9aa4b2)",
            lineHeight: 1.7,
            marginBottom: "32px",
            maxWidth: "560px",
            margin: "0 auto 32px",
          }}
        >
          Follow the International Space Station, monitor satellites, and explore
          upcoming launches with real-time data from space agencies worldwide.
        </p>

        {/* CTA Buttons */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link to="/liveiss" style={ctaStyles.primary}>
            View Live ISS Tracker
          </Link>
          <Link to="/launches" style={ctaStyles.secondary}>
            Explore Launches
          </Link>
          <Link to="/satellites" style={ctaStyles.tertiary}>
            Browse Satellites
          </Link>
        </div>
      </div>

      {/* Starfield CSS */}
      <style>{`
        .starfield {
          background-image:
            radial-gradient(1px 1px at 10% 20%, rgba(255,255,255,0.6), transparent),
            radial-gradient(1px 1px at 30% 70%, rgba(255,255,255,0.4), transparent),
            radial-gradient(1px 1px at 50% 40%, rgba(255,255,255,0.5), transparent),
            radial-gradient(1px 1px at 70% 80%, rgba(255,255,255,0.3), transparent),
            radial-gradient(1px 1px at 90% 10%, rgba(255,255,255,0.5), transparent),
            radial-gradient(1.5px 1.5px at 15% 85%, rgba(45,226,230,0.5), transparent),
            radial-gradient(1px 1px at 85% 50%, rgba(255,255,255,0.4), transparent),
            radial-gradient(1.5px 1.5px at 45% 15%, rgba(0,170,255,0.4), transparent),
            radial-gradient(1px 1px at 65% 60%, rgba(255,255,255,0.3), transparent),
            radial-gradient(1px 1px at 25% 45%, rgba(255,255,255,0.5), transparent),
            radial-gradient(1px 1px at 55% 90%, rgba(255,255,255,0.4), transparent),
            radial-gradient(1px 1px at 75% 30%, rgba(255,255,255,0.3), transparent),
            radial-gradient(1.5px 1.5px at 35% 55%, rgba(45,226,230,0.3), transparent),
            radial-gradient(1px 1px at 95% 75%, rgba(255,255,255,0.2), transparent),
            radial-gradient(1px 1px at 5% 50%, rgba(255,255,255,0.4), transparent);
        }
      `}</style>
    </section>
  );
}

const ctaStyles = {
  primary: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 28px",
    borderRadius: "var(--radius-md, 10px)",
    background: "linear-gradient(135deg, #2de2e6, #00aaff)",
    color: "#05070d",
    fontSize: "15px",
    fontWeight: 600,
    textDecoration: "none",
    transition: "all var(--transition-base, 250ms ease)",
    boxShadow: "0 0 20px rgba(45,226,230,0.3)",
  },
  secondary: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 28px",
    borderRadius: "var(--radius-md, 10px)",
    background: "rgba(45,226,230,0.1)",
    border: "1px solid rgba(45,226,230,0.3)",
    color: "#2de2e6",
    fontSize: "15px",
    fontWeight: 600,
    textDecoration: "none",
    transition: "all var(--transition-base, 250ms ease)",
  },
  tertiary: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 28px",
    borderRadius: "var(--radius-md, 10px)",
    background: "transparent",
    border: "1px solid var(--border, rgba(255,255,255,0.08))",
    color: "var(--text-secondary, #9aa4b2)",
    fontSize: "15px",
    fontWeight: 500,
    textDecoration: "none",
    transition: "all var(--transition-base, 250ms ease)",
  },
};
