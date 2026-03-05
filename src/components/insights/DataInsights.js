import React from "react";
import {
  BarChart, Bar, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

const launchData = [
  { year: "2018", launches: 114 },
  { year: "2019", launches: 102 },
  { year: "2020", launches: 114 },
  { year: "2021", launches: 146 },
  { year: "2022", launches: 186 },
  { year: "2023", launches: 212 },
  { year: "2024", launches: 238 },
  { year: "2025", launches: 255 },
];

const debrisData = [
  { year: "2000", objects: 9200 },
  { year: "2005", objects: 10100 },
  { year: "2007", objects: 12800 },
  { year: "2010", objects: 16100 },
  { year: "2013", objects: 17000 },
  { year: "2016", objects: 18800 },
  { year: "2019", objects: 20700 },
  { year: "2021", objects: 23700 },
  { year: "2023", objects: 27400 },
  { year: "2025", objects: 29400 },
];

const satelliteData = [
  { year: "2018", count: 2100 },
  { year: "2019", count: 2500 },
  { year: "2020", count: 3300 },
  { year: "2021", count: 4800 },
  { year: "2022", count: 6700 },
  { year: "2023", count: 8200 },
  { year: "2024", count: 9100 },
  { year: "2025", count: 9850 },
];

const chartCardStyle = {
  background: "var(--bg-card, rgba(12,16,32,0.7))",
  border: "1px solid var(--border, rgba(255,255,255,0.08))",
  borderRadius: "var(--radius-lg, 16px)",
  padding: "24px",
};

const chartTitleStyle = {
  fontFamily: "var(--font-heading, 'Space Grotesk', sans-serif)",
  fontSize: "14px",
  fontWeight: 600,
  color: "var(--text-primary, #e6edf3)",
  marginBottom: "20px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const customTooltipStyle = {
  background: "rgba(12,16,32,0.95)",
  border: "1px solid rgba(45,226,230,0.2)",
  borderRadius: "8px",
  padding: "8px 12px",
  color: "#e6edf3",
  fontSize: "12px",
  fontFamily: "'JetBrains Mono', monospace",
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={customTooltipStyle}>
      <div style={{ color: "#9aa4b2", marginBottom: "4px" }}>{label}</div>
      <div style={{ color: payload[0].color, fontWeight: 600 }}>
        {payload[0].value.toLocaleString()}
      </div>
    </div>
  );
}

export default function DataInsights() {
  return (
    <section className="section">
      <h2 className="section-title">Data Insights</h2>

      <div className="three-col-grid">
        {/* Launches per Year */}
        <div style={chartCardStyle}>
          <div style={chartTitleStyle}>
            <span>🚀</span> Launches per Year
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={launchData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="year"
                tick={{ fill: "#5a6577", fontSize: 11 }}
                axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#5a6577", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="launches"
                fill="#2de2e6"
                radius={[4, 4, 0, 0]}
                barSize={24}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Debris Growth */}
        <div style={chartCardStyle}>
          <div style={chartTitleStyle}>
            <span>💫</span> Debris Growth
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={debrisData}>
              <defs>
                <linearGradient id="debrisGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f87171" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#f87171" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="year"
                tick={{ fill: "#5a6577", fontSize: 11 }}
                axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#5a6577", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="objects"
                stroke="#f87171"
                fill="url(#debrisGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Satellite Count */}
        <div style={chartCardStyle}>
          <div style={chartTitleStyle}>
            <span>📡</span> Active Satellites
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={satelliteData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="year"
                tick={{ fill: "#5a6577", fontSize: 11 }}
                axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#5a6577", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#00aaff"
                strokeWidth={2}
                dot={{ fill: "#00aaff", r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "#00aaff", stroke: "#05070d", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
