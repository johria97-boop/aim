import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const CHART_ICON = "\uD83D\uDCC8";
const POINT_LEFT_ICON = "\uD83D\uDC48";

function formatTime(timestamp) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(timestamp));
}

function TrustChart({ agent, demoMode = false, onBackendError }) {
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    setHistory([]);
    setError("");

    if (!agent) {
      return undefined;
    }

    if (demoMode) {
      const now = Date.now();
      setHistory([
        { time: formatTime(now - 240000), score: Math.max(0, agent.trust_score - 8) },
        { time: formatTime(now - 180000), score: Math.max(0, agent.trust_score - 4) },
        { time: formatTime(now - 120000), score: agent.trust_score },
        { time: formatTime(now - 60000), score: Math.min(100, agent.trust_score + 2) }
      ]);
      return undefined;
    }

    async function loadTrustHistory() {
      try {
        const response = await fetch(`${API_BASE_URL}/trust-history/${agent.id}`);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Could not load trust history: ${response.status} ${response.statusText} ${errorText}`
          );
        }

        const data = await response.json();
        const nextHistory = Array.isArray(data)
          ? data.map((point) => ({
              time: formatTime(point.timestamp),
              score: point.trust_score
            }))
          : [];

        setHistory(nextHistory);
        setError("");
      } catch (err) {
        console.error("[TrustChart] failed to fetch trust history", {
          agentId: agent.id,
          error: err
        });
        setError(err.message);
        onBackendError?.();
      }
    }

    loadTrustHistory();

    const pollId = window.setInterval(loadTrustHistory, 3000);

    return () => window.clearInterval(pollId);
  }, [agent, demoMode, onBackendError]);

  return (
    <section className="y2k-window trust-chart-window">
      <header className="y2k-titlebar trust-chart-titlebar">
        <span>
          {CHART_ICON} Trust Score History — {agent?.screen_name || "..."}
        </span>
        <span className="y2k-window-controls" aria-hidden="true">
          <span className="y2k-window-control is-minimize" />
          <span className="y2k-window-control is-maximize" />
          <span className="y2k-window-control is-close" />
        </span>
      </header>

      <div className="y2k-window-body trust-chart-body">
        {!agent ? (
          <p className="trust-chart-placeholder">
            Select a buddy to see their trust history{" "}
            <span className="blink-text">{POINT_LEFT_ICON}</span>
          </p>
        ) : (
          <>
            {error ? <p className="trust-chart-error blink-text">{error}</p> : null}
            <div className="trust-chart-canvas">
              <ResponsiveContainer height="100%" width="100%">
                <LineChart data={history} margin={{ top: 14, right: 20, bottom: 6, left: 0 }}>
                  <CartesianGrid stroke="#d8d8d8" strokeDasharray="3 3" />
                  <ReferenceArea y1={0} y2={30} fill="#ff0033" fillOpacity={0.08} />
                  <ReferenceLine
                    y={50}
                    stroke="#888888"
                    strokeDasharray="5 4"
                    label={{ value: "Neutral", fill: "#666666", fontSize: 11 }}
                  />
                  <XAxis
                    dataKey="time"
                    tick={{ fill: "#111111", fontFamily: "Tahoma, MS Sans Serif, sans-serif", fontSize: 11 }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: "#111111", fontFamily: "Tahoma, MS Sans Serif, sans-serif", fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#c0c0c0",
                      border: "2px outset #c0c0c0",
                      color: "#111111",
                      fontFamily: "Tahoma, MS Sans Serif, sans-serif",
                      fontSize: "12px"
                    }}
                  />
                  <Line
                    dataKey="score"
                    dot={{
                      fill: "var(--y2k-neon-green)",
                      r: 4,
                      stroke: "var(--y2k-blue)",
                      strokeWidth: 1
                    }}
                    isAnimationActive={false}
                    name="Trust"
                    stroke="var(--y2k-neon-green)"
                    strokeWidth={2}
                    type="monotone"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default TrustChart;
