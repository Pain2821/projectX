import React, { useState, useEffect, useCallback } from "react";
import { NavLink, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/", label: "Home", icon: "🏠" },
  { to: "/liveiss", label: "ISS Tracker", icon: "🛰" },
  { to: "/satellites", label: "Satellites", icon: "📡" },
  { to: "/launches", label: "Launches", icon: "🚀" },
  { to: "/mars", label: "Mars Weather", icon: "🔴" },
  { to: "/exoplanets", label: "Exoplanets", icon: "🌍" },
  { to: "/debris", label: "Orbital Debris", icon: "💫" },
  { to: "/news", label: "Space News", icon: "📰" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const toggleMenu = useCallback(() => setMenuOpen((prev) => !prev), []);

  return (
    <>
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: "var(--z-header, 1400)",
          padding: "0 var(--space-lg, 24px)",
          transition: "all var(--transition-base, 250ms ease)",
          background: scrolled
            ? "rgba(10, 12, 20, 0.92)"
            : "rgba(10, 12, 20, 0.4)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: scrolled
            ? "1px solid rgba(255,255,255,0.08)"
            : "1px solid transparent",
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "64px",
          }}
        >
          {/* Logo */}
          <NavLink
            to="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              textDecoration: "none",
              color: "var(--text-primary, #e6edf3)",
            }}
          >
            <span style={{ fontSize: "24px" }}>🛰</span>
            <span
              style={{
                fontFamily: "var(--font-heading, 'Space Grotesk', sans-serif)",
                fontSize: "18px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                background: "linear-gradient(135deg, #2de2e6, #00aaff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              ORBITAL
            </span>
          </NavLink>

          {/* Desktop Nav */}
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
            className="desktop-nav"
          >
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                style={({ isActive }) => ({
                  color: isActive ? "#2de2e6" : "var(--text-secondary, #9aa4b2)",
                  textDecoration: "none",
                  fontSize: "13px",
                  fontWeight: 500,
                  padding: "6px 12px",
                  borderRadius: "var(--radius-sm, 6px)",
                  background: isActive ? "rgba(45,226,230,0.1)" : "transparent",
                  transition: "all var(--transition-fast, 150ms ease)",
                  whiteSpace: "nowrap",
                })}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right Actions */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
            className="header-actions"
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                color: "var(--success, #34d399)",
                fontFamily: "var(--font-mono, monospace)",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "var(--success, #34d399)",
                  boxShadow: "0 0 8px rgba(52,211,153,0.5)",
                  display: "inline-block",
                }}
              />
              API Live
            </span>

            {/* Hamburger (mobile) */}
            <button
              onClick={toggleMenu}
              className="hamburger-btn"
              aria-label="Toggle menu"
              style={{
                display: "none",
                background: "none",
                border: "1px solid var(--border, rgba(255,255,255,0.08))",
                borderRadius: "var(--radius-sm, 6px)",
                color: "var(--text-primary, #e6edf3)",
                cursor: "pointer",
                padding: "6px 10px",
                fontSize: "18px",
              }}
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div
          className="mobile-drawer"
          style={{
            position: "fixed",
            top: "64px",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1399,
            background: "rgba(5,7,13,0.95)",
            backdropFilter: "blur(20px)",
            padding: "var(--space-lg, 24px)",
            animation: "fadeIn 200ms ease",
            overflowY: "auto",
          }}
        >
          <nav
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => setMenuOpen(false)}
                style={({ isActive }) => ({
                  color: isActive ? "#2de2e6" : "var(--text-secondary, #9aa4b2)",
                  textDecoration: "none",
                  fontSize: "16px",
                  fontWeight: 500,
                  padding: "14px 16px",
                  borderRadius: "var(--radius-md, 10px)",
                  background: isActive ? "rgba(45,226,230,0.1)" : "transparent",
                  border: "1px solid " + (isActive ? "rgba(45,226,230,0.2)" : "transparent"),
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  minHeight: "44px",
                })}
              >
                <span>{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}

      <style>{`
        .desktop-nav { display: flex !important; }
        .hamburger-btn { display: none !important; }
        .mobile-drawer { display: none; }

        @media (max-width: 900px) {
          .desktop-nav { display: none !important; }
          .hamburger-btn { display: flex !important; }
          .mobile-drawer { display: block !important; }
        }
      `}</style>
    </>
  );
}
