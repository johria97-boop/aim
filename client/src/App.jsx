import { useCallback, useEffect, useMemo, useState } from "react";
import BuddyList from "./components/BuddyList.jsx";
import ChatLogWindow from "./components/ChatLogWindow.jsx";
import FakeStore from "./components/FakeStore.jsx";
import Leaderboard from "./components/Leaderboard.jsx";
import OwnerApprovalPopup from "./components/OwnerApprovalPopup.jsx";
import RetroTerminal from "./components/RetroTerminal.jsx";
import TrustChart from "./components/TrustChart.jsx";

const DEMO_MODE = false;
const API_BASE_URL = "http://localhost:5000";
const DIALUP_SOUND =
  "data:audio/wav;base64,UklGRlQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YTAAAACAgP///wAAAP//AAAA//8AAID/AAAAAP//AAD//wAAAP8AAID/AAAA//8AAP//AAAA";
const BUTTON_HOVER_SOUND =
  "data:audio/wav;base64,UklGRjQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YRAAAAAAAP//AAD//wAA//8AAP//AAD//wAA//8AAA==";
const MARQUEE_TEXT =
  "\u2605\u5F61 the internet needs a bouncer for bots \u2729\u00B0\uFF61\u22C6 AI agents welcome \u2605\u5F61";

const DEMO_AGENTS = [
  {
    id: "demo-agent-001",
    screen_name: "TravelBot99x",
    owner_name: "Maya Demo",
    trust_score: 92,
    spend_limit: 50,
    status: "online",
    token: "DEMOTravel99x001",
    created_at: "2026-07-11T04:30:00.000Z"
  },
  {
    id: "demo-agent-002",
    screen_name: "xXShopAgentXx",
    owner_name: "Hackathon Judge",
    trust_score: 84,
    spend_limit: 75,
    status: "away",
    token: "DEMOShopXx00002",
    created_at: "2026-07-11T04:32:00.000Z"
  },
  {
    id: "demo-agent-003",
    screen_name: "FirewallBuddy2k",
    owner_name: "A.I.M. Security",
    trust_score: 99,
    spend_limit: 35,
    status: "online",
    token: "DEMOFire2k00003",
    created_at: "2026-07-11T04:35:00.000Z"
  }
];

const DEMO_CHATLOGS = {
  "demo-agent-001": [
    {
      id: "demo-chat-001",
      agent_id: "demo-agent-001",
      from: "system",
      text: "A.I.M. identity token issued.",
      timestamp: "2026-07-11T04:36:01.000Z"
    },
    {
      id: "demo-chat-002",
      agent_id: "demo-agent-001",
      from: "agent",
      text: "heyy it's me, TravelBot99x - checking in from Y2KShop.com",
      timestamp: "2026-07-11T04:36:04.000Z"
    },
    {
      id: "demo-chat-003",
      agent_id: "demo-agent-001",
      from: "website",
      text: "you're verified! trust_score: 92, spend_limit: $50",
      timestamp: "2026-07-11T04:36:07.000Z"
    }
  ],
  "demo-agent-002": [
    {
      id: "demo-chat-004",
      agent_id: "demo-agent-002",
      from: "website",
      text: "Please confirm spend limit before checkout.",
      timestamp: "2026-07-11T04:37:10.000Z"
    },
    {
      id: "demo-chat-005",
      agent_id: "demo-agent-002",
      from: "agent",
      text: "sorry, this is over my spend limit, can't approve this one",
      timestamp: "2026-07-11T04:37:13.000Z"
    }
  ],
  "demo-agent-003": [
    {
      id: "demo-chat-006",
      agent_id: "demo-agent-003",
      from: "system",
      text: "Suspicious request detected from Coupons4U.biz. Agent auto-protection is ready.",
      timestamp: "2026-07-11T04:38:44.000Z"
    }
  ]
};

const DEMO_EVENTS = [
  {
    id: "demo-event-001",
    agent_id: "demo-agent-001",
    type: "status_change",
    detail: "TravelBot99x came online",
    timestamp: "2026-07-11T04:35:58.000Z"
  },
  {
    id: "demo-event-002",
    agent_id: "demo-agent-001",
    type: "verify",
    detail: "TravelBot99x verified by Y2KShop.com",
    timestamp: "2026-07-11T04:36:07.000Z"
  },
  {
    id: "demo-event-003",
    agent_id: "demo-agent-002",
    type: "transact_blocked",
    detail: "xXShopAgentXx rejected $120 purchase - exceeds limit of $75",
    timestamp: "2026-07-11T04:37:14.000Z"
  },
  {
    id: "demo-event-004",
    agent_id: "demo-agent-003",
    type: "transact_blocked",
    detail: "Blocked suspicious request from Coupons4U.biz: possible prompt injection",
    timestamp: "2026-07-11T04:38:45.000Z"
  },
  {
    id: "demo-event-005",
    agent_id: "demo-agent-001",
    type: "transact_approved",
    detail: "TravelBot99x completed a $45 purchase at Y2KShop.com",
    timestamp: "2026-07-11T04:39:12.000Z"
  }
];

const DEMO_PENDING_APPROVALS = [
  {
    id: "demo-approval-001",
    agent_id: "demo-agent-001",
    amount: 45,
    site_name: "Y2KShop.com",
    request_note: "customer wants to buy the retro flip phone",
    status: "pending",
    created_at: "2026-07-11T04:39:10.000Z"
  }
];

function CounterDigits({ value }) {
  return (
    <span className="visitor-counter-number">
      {value.split("").map((digit, index) => (
        <span className="visitor-counter-digit" key={`${digit}-${index}`}>
          {digit}
        </span>
      ))}
    </span>
  );
}

function App() {
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [events, setEvents] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [demoMode, setDemoMode] = useState(DEMO_MODE);
  const [isConnecting, setIsConnecting] = useState(true);
  const [activeDetailTab, setActiveDetailTab] = useState("chat");
  const [error, setError] = useState("");

  const activateDemoMode = useCallback(() => {
    setDemoMode(true);
    setAgents(DEMO_AGENTS);
    setSelectedAgent((currentAgent) => {
      if (!currentAgent) {
        return DEMO_AGENTS[0];
      }

      return DEMO_AGENTS.find((agent) => agent.id === currentAgent.id) || DEMO_AGENTS[0];
    });
    setEvents(DEMO_EVENTS);
    setPendingApprovals(DEMO_PENDING_APPROVALS);
    setError("");
  }, []);

  const loadAgents = useCallback(async () => {
    if (demoMode) {
      setAgents(DEMO_AGENTS);
      setSelectedAgent((currentAgent) => currentAgent || DEMO_AGENTS[0]);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/agents`);

      if (!response.ok) {
        throw new Error("Could not load agents");
      }

      const data = await response.json();
      const nextAgents = Array.isArray(data) ? data : [];
      setAgents(nextAgents);
      setSelectedAgent((currentAgent) => {
        if (!nextAgents.length) {
          return null;
        }

        return nextAgents.find((agent) => agent.id === currentAgent?.id) || nextAgents[0];
      });
      setError("");
    } catch (err) {
      activateDemoMode();
    }
  }, [activateDemoMode, demoMode]);

  const loadEvents = useCallback(async () => {
    if (demoMode) {
      setEvents(DEMO_EVENTS);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/events`);

      if (!response.ok) {
        throw new Error("Could not load events");
      }

      const data = await response.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      activateDemoMode();
    }
  }, [activateDemoMode, demoMode]);

  const loadPendingApprovals = useCallback(async () => {
    if (demoMode) {
      setPendingApprovals((current) => (current.length ? current : DEMO_PENDING_APPROVALS));
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/pending-approvals`);

      if (!response.ok) {
        throw new Error("Could not load pending approvals");
      }

      const data = await response.json();
      setPendingApprovals(Array.isArray(data) ? data : []);
    } catch (err) {
      activateDemoMode();
    }
  }, [activateDemoMode, demoMode]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lastSparkleRef = { current: 0 };
    const buttonSound = new Audio(BUTTON_HOVER_SOUND);
    buttonSound.volume = 0.08;

    function handleMouseMove(event) {
      if (prefersReducedMotion) {
        return;
      }

      const now = performance.now();

      if (now - lastSparkleRef.current < 45) {
        return;
      }

      lastSparkleRef.current = now;

      const sparkle = document.createElement("span");
      sparkle.className = "y2k-cursor-sparkle";
      sparkle.style.left = `${event.clientX}px`;
      sparkle.style.top = `${event.clientY}px`;
      document.body.appendChild(sparkle);
      window.setTimeout(() => sparkle.remove(), 650);
    }

    function handleButtonHover(event) {
      const button = event.target.closest?.(".y2k-button");

      if (!button || button.contains(event.relatedTarget)) {
        return;
      }

      buttonSound.currentTime = 0;
      buttonSound.play().catch(() => {});
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseover", handleButtonHover);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseover", handleButtonHover);
    };
  }, []);

  useEffect(() => {
    const sound = new Audio(DIALUP_SOUND);
    sound.volume = 0.15;
    sound.play().catch(() => {});

    const loadingId = window.setTimeout(() => setIsConnecting(false), 2000);

    return () => window.clearTimeout(loadingId);
  }, []);

  useEffect(() => {
    loadAgents();
    loadEvents();
    loadPendingApprovals();

    const eventsPollId = window.setInterval(loadEvents, 2000);
    const approvalsPollId = window.setInterval(loadPendingApprovals, 2000);

    return () => {
      window.clearInterval(eventsPollId);
      window.clearInterval(approvalsPollId);
    };
  }, [loadAgents, loadEvents, loadPendingApprovals]);

  const handleApprovalResolved = useCallback((approvalId, decision) => {
    const approval = pendingApprovals.find((item) => item.id === approvalId);
    const agent = agents.find((item) => item.id === approval?.agent_id);

    setPendingApprovals((current) => current.filter((item) => item.id !== approvalId));

    if (demoMode && approval && agent) {
      const eventType = decision === "approved" ? "transact_approved" : "transact_blocked";
      const detail =
        decision === "approved"
          ? `Owner approved $${approval.amount} purchase for ${agent.screen_name}`
          : `Owner denied $${approval.amount} purchase for ${agent.screen_name}`;

      setEvents((current) => [
        {
          id: `demo-event-${Date.now()}`,
          agent_id: agent.id,
          type: eventType,
          detail,
          timestamp: new Date().toISOString()
        },
        ...current
      ]);
    } else {
      loadAgents();
      loadEvents();
      loadPendingApprovals();
    }
  }, [agents, demoMode, loadAgents, loadEvents, loadPendingApprovals, pendingApprovals]);

  const shoppingToken = selectedAgent?.token || agents[0]?.token || "";
  const handshakeCount = useMemo(() => {
    const actionEvents = events.filter((event) =>
      ["verify", "transact_approved", "transact_blocked"].includes(event.type)
    ).length;

    return String(342 + actionEvents).padStart(6, "0");
  }, [events]);

  return (
    <main className="aim-dashboard y2k-page-bg y2k-cursor-zone">
      {isConnecting ? (
        <div className="dialup-overlay">
          <section className="y2k-window dialup-window">
            <header className="y2k-titlebar">
              <span>Connecting to A.I.M.</span>
              <span className="y2k-window-controls" aria-hidden="true">
                <span className="y2k-window-control is-minimize" />
                <span className="y2k-window-control is-maximize" />
                <span className="y2k-window-control is-close" />
              </span>
            </header>
            <div className="y2k-window-body dialup-body">
              <p>Connecting...</p>
              <div className="dialup-progress" aria-hidden="true">
                <span />
              </div>
              <small>Authenticating buddy list identities...</small>
            </div>
          </section>
        </div>
      ) : null}

      <header className="dashboard-header y2k-window">
        <div className="y2k-titlebar">
          <span>A.I.M. Control Center</span>
          <span className="y2k-window-controls" aria-hidden="true">
            <span className="y2k-window-control is-minimize" />
            <span className="y2k-window-control is-maximize" />
            <span className="y2k-window-control is-close" />
          </span>
        </div>
        <div className="y2k-window-body dashboard-header-body">
          <h1 className="y2k-logo">A.I.M.</h1>
          <div className="marquee-text dashboard-marquee" data-text={MARQUEE_TEXT} />
        </div>
      </header>

      {demoMode ? <div className="offline-demo-badge">⚡ Offline Demo Mode</div> : null}

      {error ? <p className="dashboard-error blink-text">{error}</p> : null}

      <section className="dashboard-grid">
        <aside className="dashboard-buddy-column">
          <BuddyList
            agents={agents}
            onAgentsChange={setAgents}
            onRefreshAgents={loadAgents}
            onSelectAgent={setSelectedAgent}
            selectedAgentId={selectedAgent?.id}
            demoMode={demoMode}
            onBackendError={activateDemoMode}
          />
          <Leaderboard
            agents={agents}
            onSelectAgent={setSelectedAgent}
            selectedAgentId={selectedAgent?.id}
          />
        </aside>

        <section className="dashboard-center-column">
          <section className="detail-tabs">
            <div className="detail-tab-buttons" role="tablist" aria-label="Selected agent details">
              <button
                aria-selected={activeDetailTab === "chat"}
                className={`y2k-button ${activeDetailTab === "chat" ? "is-active" : ""}`}
                onClick={() => setActiveDetailTab("chat")}
                role="tab"
                type="button"
              >
                Chat
              </button>
              <button
                aria-selected={activeDetailTab === "trust"}
                className={`y2k-button ${activeDetailTab === "trust" ? "is-active" : ""}`}
                onClick={() => setActiveDetailTab("trust")}
                role="tab"
                type="button"
              >
                Trust History
              </button>
            </div>

            {activeDetailTab === "chat" ? (
              <ChatLogWindow
                agent={selectedAgent}
                demoChatLogs={DEMO_CHATLOGS}
                demoMode={demoMode}
                onBackendError={activateDemoMode}
              />
            ) : (
              <TrustChart
                agent={selectedAgent}
                demoMode={demoMode}
                onBackendError={activateDemoMode}
              />
            )}
          </section>
          <div className="terminal-stack">
            <span className="under-construction-badge terminal-construction-badge">
              <span>🚧 Under Construction</span>
            </span>
            <RetroTerminal
              demoEvents={DEMO_EVENTS}
              demoMode={demoMode}
              events={events}
              onBackendError={activateDemoMode}
            />
          </div>
        </section>

        <aside className="dashboard-store-column">
          <FakeStore demoMode={demoMode} onBackendError={activateDemoMode} token={shoppingToken} />
        </aside>
      </section>

      <footer className="dashboard-footer">
        <div className="visitor-counter" aria-label={`Total Handshakes: ${handshakeCount}`}>
          <span className="visitor-counter-label">Total Handshakes:</span>
          <CounterDigits value={handshakeCount} />
        </div>
      </footer>

      <OwnerApprovalPopup
        agents={agents}
        demoMode={demoMode}
        onBackendError={activateDemoMode}
        onResolved={handleApprovalResolved}
        pendingApprovals={pendingApprovals}
      />
    </main>
  );
}

export default App;
