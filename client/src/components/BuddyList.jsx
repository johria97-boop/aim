import { useCallback, useEffect, useMemo, useState } from "react";

const API_BASE_URL = "http://localhost:5000";
const ONLINE_ICON = "\uD83D\uDFE2";
const POINT_UP_ICON = "\uD83D\uDC46";
const EM_DASH = "\u2014";

const statusDotClassNames = {
  online: "status-dot-online",
  away: "status-dot-away",
  invisible: "status-dot-invisible"
};

function BuddyList({
  agents,
  onAgentsChange,
  onRefreshAgents,
  onSelectAgent,
  selectedAgentId,
  demoMode = false,
  onBackendError
}) {
  const [localAgents, setLocalAgents] = useState([]);
  const [ownerName, setOwnerName] = useState("");
  const [isAddingAgent, setIsAddingAgent] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const renderedAgents = useMemo(
    () => (Array.isArray(agents) ? agents : localAgents),
    [agents, localAgents]
  );

  const loadAgents = useCallback(async () => {
    if (onRefreshAgents) {
      await onRefreshAgents();
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/agents`);

      if (!response.ok) {
        throw new Error("Could not load buddy list");
      }

      const data = await response.json();
      const nextAgents = Array.isArray(data) ? data : [];
      setLocalAgents(nextAgents);
      onAgentsChange?.(nextAgents);
      setError("");
    } catch (err) {
      onBackendError?.();
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [onAgentsChange, onRefreshAgents]);

  useEffect(() => {
    loadAgents();

    const pollId = window.setInterval(loadAgents, 3000);

    return () => window.clearInterval(pollId);
  }, [loadAgents]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!ownerName.trim()) {
      setError("Owner name is required");
      return;
    }

    try {
      if (demoMode) {
        const demoAgent = {
          id: `demo-agent-${Date.now()}`,
          screen_name: `xX${ownerName.trim().replace(/\s+/g, "")}BotXx`.slice(0, 28),
          owner_name: ownerName.trim(),
          trust_score: 80,
          spend_limit: 50,
          status: "online",
          token: `DEMO${String(Date.now()).slice(-12)}`,
          created_at: new Date().toISOString()
        };
        const nextAgents = [...renderedAgents, demoAgent];

        setLocalAgents(nextAgents);
        onAgentsChange?.(nextAgents);
        onSelectAgent?.(demoAgent);
        setOwnerName("");
        setIsAddingAgent(false);
        setError("");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ owner_name: ownerName.trim() })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Could not add agent");
      }

      setOwnerName("");
      setIsAddingAgent(false);
      setError("");
      await loadAgents();
    } catch (err) {
      onBackendError?.();
      setError("");
    }
  }

  return (
    <section className="y2k-window buddy-list-window">
      <header className="y2k-titlebar buddy-list-titlebar">
        <span>
          {ONLINE_ICON} Buddy List {EM_DASH} A.I.M.
        </span>
        <span className="y2k-window-controls" aria-hidden="true">
          <span className="y2k-window-control is-minimize" />
          <span className="y2k-window-control is-maximize" />
          <span className="y2k-window-control is-close" />
        </span>
      </header>

      <div className="y2k-window-body buddy-list-body">
        {error ? <p className="buddy-list-error blink-text">{error}</p> : null}

        {isLoading ? (
          <p className="buddy-list-loading">Dialing up buddies...</p>
        ) : renderedAgents.length > 0 ? (
          <div className="buddy-list-rows retro-scrollbar">
            {renderedAgents.map((agent) => (
              <button
                className={`buddy-list-row ${agent.id === selectedAgentId ? "is-selected" : ""}`}
                key={agent.id}
                onClick={() => onSelectAgent?.(agent)}
                type="button"
              >
                <span
                  className={statusDotClassNames[agent.status] || "status-dot-invisible"}
                  aria-label={`${agent.status} status`}
                />
                <span className="buddy-list-row-text">
                  <strong>{agent.screen_name}</strong>
                  <small>
                    Trust: {agent.trust_score} | Limit: ${agent.spend_limit}
                  </small>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="buddy-list-empty">
            No buddies yet! Add your first AI agent above{" "}
            <span className="blink-text">{POINT_UP_ICON}</span>
          </p>
        )}

        {isAddingAgent ? (
          <form className="buddy-list-form" onSubmit={handleSubmit}>
            <label htmlFor="buddy-owner-name">Owner name</label>
            <div className="buddy-list-form-row">
              <input
                id="buddy-owner-name"
                name="owner_name"
                onChange={(event) => setOwnerName(event.target.value)}
                placeholder="e.g. Casey from GeoCities"
                type="text"
                value={ownerName}
              />
              <button className="y2k-button" type="submit">
                Save
              </button>
            </div>
          </form>
        ) : null}

        <button
          className="y2k-button buddy-list-add-button"
          onClick={() => setIsAddingAgent((current) => !current)}
          type="button"
        >
          + Add Agent
        </button>
      </div>
    </section>
  );
}

export default BuddyList;
