import { useEffect, useRef, useState } from "react";

const API_BASE_URL = "http://localhost:5000";
const TERMINAL_TITLE = "C:\\AIM\\SYSTEM_LOG.exe";
const CURSOR_BLOCK = "\u258A";

const typeIcons = {
  verify: "\u2705",
  transact_approved: "\uD83D\uDCB0",
  transact_blocked: "\uD83D\uDED1",
  status_change: "\uD83D\uDD04"
};

function formatTimestamp(timestamp) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(new Date(timestamp));
}

function RetroTerminal({ demoEvents = [], demoMode = false, events: providedEvents, onBackendError }) {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");
  const terminalRef = useRef(null);

  useEffect(() => {
    if (Array.isArray(providedEvents)) {
      setEvents([...providedEvents].reverse());
      setError("");
      return undefined;
    }

    if (demoMode) {
      setEvents([...demoEvents].reverse());
      setError("");
      return undefined;
    }

    async function loadEvents() {
      try {
        const response = await fetch(`${API_BASE_URL}/events`);

        if (!response.ok) {
          throw new Error("Could not load system log");
        }

        const data = await response.json();
        setEvents(Array.isArray(data) ? [...data].reverse() : []);
        setError("");
      } catch (err) {
        setError(err.message);
        onBackendError?.();
      }
    }

    loadEvents();

    const pollId = window.setInterval(loadEvents, 2000);

    return () => window.clearInterval(pollId);
  }, [demoEvents, demoMode, onBackendError, providedEvents]);

  useEffect(() => {
    terminalRef.current?.scrollTo({
      top: terminalRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [events, error]);

  return (
    <section className="retro-terminal-window">
      <header className="retro-terminal-titlebar">{TERMINAL_TITLE}</header>
      <div className="retro-terminal-body retro-scrollbar" ref={terminalRef}>
        {error ? (
          <p className="retro-terminal-line is-blocked">[ERROR] {typeIcons.transact_blocked} {error}</p>
        ) : null}

        {events.map((event, index) => {
          const isLastLine = index === events.length - 1 && !error;
          const isBlocked = event.type === "transact_blocked";

          return (
            <p
              className={`retro-terminal-line ${isBlocked ? "is-blocked" : ""}`}
              key={event.id}
            >
              <span>
                [{formatTimestamp(event.timestamp)}] {typeIcons[event.type] || ">"}
                {" "}
                {event.detail}
              </span>
              {isLastLine ? <span className="retro-terminal-cursor">{CURSOR_BLOCK}</span> : null}
            </p>
          );
        })}

        {!error && events.length === 0 ? (
          <p className="retro-terminal-line">
            <span>[00:00:00] &gt; awaiting system events</span>
            <span className="retro-terminal-cursor">{CURSOR_BLOCK}</span>
          </p>
        ) : null}
      </div>
    </section>
  );
}

export default RetroTerminal;
