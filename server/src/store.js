export const agents = [
  {
    id: "aim-001",
    screenName: "VerifierBot99",
    owner: "A.I.M. Core",
    status: "online",
    trustScore: 98,
    capabilities: ["identity-check", "handshake-verification", "audit-log"],
    lastHandshake: "2026-07-11T04:55:00.000Z"
  },
  {
    id: "aim-002",
    screenName: "WebsiteWatcherXP",
    owner: "Demo Tenant",
    status: "away",
    trustScore: 87,
    capabilities: ["site-monitoring", "policy-check"],
    lastHandshake: "2026-07-11T04:47:00.000Z"
  },
  {
    id: "aim-003",
    screenName: "ShadowAgentBlocked",
    owner: "Unknown",
    status: "invisible",
    trustScore: 22,
    capabilities: ["unverified"],
    lastHandshake: "2026-07-11T04:31:00.000Z"
  }
];

export const handshakes = [
  {
    id: "hs-007342",
    agentId: "aim-001",
    result: "verified",
    message: "Signed identity handshake accepted."
  },
  {
    id: "hs-007341",
    agentId: "aim-002",
    result: "review",
    message: "Policy scope changed. Manual review recommended."
  }
];
