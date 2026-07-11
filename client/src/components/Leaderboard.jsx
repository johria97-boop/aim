const TROPHY_ICON = "\uD83C\uDFC6";
const MEDALS = ["\uD83E\uDD47", "\uD83E\uDD48", "\uD83E\uDD49"];

const statusDotClassNames = {
  online: "status-dot-online",
  away: "status-dot-away",
  invisible: "status-dot-invisible"
};

function Leaderboard({ agents = [], onSelectAgent, selectedAgentId }) {
  const rankedAgents = [...agents].sort((left, right) => right.trust_score - left.trust_score);

  return (
    <section className="y2k-window leaderboard-window">
      <header className="y2k-titlebar leaderboard-titlebar">
        <span>{TROPHY_ICON} Most Trusted Agents</span>
        <span className="y2k-window-controls" aria-hidden="true">
          <span className="y2k-window-control is-minimize" />
          <span className="y2k-window-control is-maximize" />
          <span className="y2k-window-control is-close" />
        </span>
      </header>

      <div className="y2k-window-body leaderboard-body">
        <p className="leaderboard-subtitle">Updated live as agents build (or lose) trust</p>

        <div className="sunken-panel leaderboard-table-wrap retro-scrollbar">
          <table className="interactive leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Screen Name</th>
                <th>Trust Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rankedAgents.length > 0 ? (
                rankedAgents.map((agent, index) => {
                  const rank = index + 1;
                  const medal = MEDALS[index];

                  return (
                    <tr
                      className={`leaderboard-row ${rank <= 3 ? `is-top-${rank}` : ""} ${
                        agent.id === selectedAgentId ? "is-selected" : ""
                      }`}
                      key={agent.id}
                      onClick={() => onSelectAgent?.(agent)}
                      tabIndex={0}
                    >
                      <td>{medal || rank}</td>
                      <td>
                        <strong>{agent.screen_name}</strong>
                      </td>
                      <td>{agent.trust_score}</td>
                      <td>
                        <span
                          className={statusDotClassNames[agent.status] || "status-dot-invisible"}
                          aria-label={`${agent.status} status`}
                        />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="4">No agents ranked yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default Leaderboard;
