import crypto from "crypto";

const VALID_STATUSES = new Set(["online", "away", "invisible"]);
const VALID_CHAT_SENDERS = new Set(["agent", "website", "system"]);
const VALID_EVENT_TYPES = new Set([
  "verify",
  "transact_approved",
  "transact_blocked",
  "status_change"
]);

const screenNamePrefixes = [
  "TravelBot",
  "ShopAgent",
  "TrustBuddy",
  "CyberPal",
  "MallCrawler",
  "FormFiller",
  "WalletWizard",
  "xXAgent",
  "AIMster",
  "NeoVerifier"
];

const screenNameSuffixes = ["99", "2k", "XP", "x", "Xx", "404", "1337", "v2", "OMG", "dotCom"];

const agents = [];
const chatLogs = [];
const events = [];
const pendingApprovals = [];
const trustHistory = [];

function now() {
  return new Date().toISOString();
}

function createId() {
  return crypto.randomUUID();
}

function createToken() {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.randomBytes(16);

  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function generateScreenName() {
  const style = Math.floor(Math.random() * 4);
  const prefix = randomItem(screenNamePrefixes);
  const suffix = randomItem(screenNameSuffixes);

  if (style === 0) {
    return `${prefix}${suffix}`;
  }

  if (style === 1) {
    return `xX${prefix}Xx`;
  }

  if (style === 2) {
    return `${prefix}_${Math.floor(10 + Math.random() * 90)}`;
  }

  return `${prefix}${Math.floor(90 + Math.random() * 10)}${suffix}`;
}

export function createAgent(owner_name) {
  if (!owner_name) {
    throw new Error("owner_name is required");
  }

  const agent = {
    id: createId(),
    screen_name: generateScreenName(),
    owner_name,
    trust_score: 80,
    spend_limit: 50,
    status: "online",
    token: createToken(),
    created_at: now()
  };

  agents.push(agent);
  recordTrustScore(agent.id, agent.trust_score);
  return agent;
}

export function findAgentByToken(token) {
  return agents.find((agent) => agent.token === token) || null;
}

export function findAgentById(id) {
  return agents.find((agent) => agent.id === id) || null;
}

export function getAllAgents() {
  return [...agents];
}

export function recordTrustScore(agent_id, trust_score) {
  if (!findAgentById(agent_id)) {
    throw new Error("agent not found");
  }

  const point = {
    id: createId(),
    agent_id,
    trust_score,
    timestamp: now()
  };

  trustHistory.push(point);
  return point;
}

export function adjustTrustScore(agent_id, delta) {
  const agent = findAgentById(agent_id);

  if (!agent) {
    throw new Error("agent not found");
  }

  agent.trust_score = Math.max(0, Math.min(100, agent.trust_score + delta));
  recordTrustScore(agent.id, agent.trust_score);

  return agent;
}

export function getTrustHistoryForAgent(agent_id) {
  return trustHistory
    .filter((point) => point.agent_id === agent_id)
    .sort((left, right) => new Date(left.timestamp) - new Date(right.timestamp));
}

export function addChatLog(agent_id, from, text) {
  if (agent_id && !findAgentById(agent_id)) {
    throw new Error("agent not found");
  }

  if (!VALID_CHAT_SENDERS.has(from)) {
    throw new Error("invalid chat sender");
  }

  if (!text) {
    throw new Error("text is required");
  }

  const message = {
    id: createId(),
    agent_id,
    from,
    text,
    timestamp: now()
  };

  chatLogs.push(message);
  console.log("[db.addChatLog]", {
    stored_agent_id: message.agent_id,
    from: message.from,
    total_chatlogs: chatLogs.length
  });
  return message;
}

export function getChatLogsForAgent(agent_id) {
  const logs = chatLogs
    .filter((message) => message.agent_id === agent_id)
    .sort((left, right) => new Date(left.timestamp) - new Date(right.timestamp));

  console.log("[db.getChatLogsForAgent]", {
    requested_agent_id: agent_id,
    all_chatlog_agent_ids: chatLogs.map((message) => message.agent_id),
    matched_count: logs.length
  });

  return logs;
}

export function addEvent(agent_id, type, detail) {
  if (agent_id && !findAgentById(agent_id)) {
    throw new Error("agent not found");
  }

  if (!VALID_EVENT_TYPES.has(type)) {
    throw new Error("invalid event type");
  }

  if (!detail) {
    throw new Error("detail is required");
  }

  const event = {
    id: createId(),
    agent_id,
    type,
    detail,
    timestamp: now()
  };

  events.push(event);
  return event;
}

export function getAllEvents() {
  return [...events]
    .sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp))
    .slice(0, 50);
}

export function createPendingApproval(agent_id, amount, site_name, request_note) {
  if (!findAgentById(agent_id)) {
    throw new Error("agent not found");
  }

  const approval = {
    id: createId(),
    agent_id,
    amount: Number(amount),
    site_name,
    request_note,
    status: "pending",
    created_at: now()
  };

  pendingApprovals.push(approval);
  return approval;
}

export function getPendingApprovals() {
  return pendingApprovals.filter((approval) => approval.status === "pending");
}

export function resolveApproval(id, decision) {
  if (!["approved", "denied"].includes(decision)) {
    throw new Error("decision must be approved or denied");
  }

  const approval = pendingApprovals.find((item) => item.id === id);

  if (!approval) {
    throw new Error("approval not found");
  }

  approval.status = decision;
  return approval;
}

export function updateAgentStatus(agent_id, newStatus) {
  if (!VALID_STATUSES.has(newStatus)) {
    throw new Error("invalid status");
  }

  const agent = findAgentById(agent_id);

  if (!agent) {
    throw new Error("agent not found");
  }

  agent.status = newStatus;
  addEvent(agent.id, "status_change", `${agent.screen_name} is now ${newStatus}.`);

  return agent;
}

function seedAgent({ owner_name, screen_name, trust_score, spend_limit, status }) {
  const agent = createAgent(owner_name);

  agent.screen_name = screen_name;
  agent.trust_score = trust_score;
  agent.spend_limit = spend_limit;
  agent.status = status;
  recordTrustScore(agent.id, agent.trust_score);

  return agent;
}

const seededAgents = [
  seedAgent({
    owner_name: "A.I.M. Demo User",
    screen_name: "TravelBot99x",
    trust_score: 92,
    spend_limit: 50,
    status: "online"
  }),
  seedAgent({
    owner_name: "Hackathon Judge",
    screen_name: "xXShopAgentXx",
    trust_score: 84,
    spend_limit: 75,
    status: "away"
  }),
  seedAgent({
    owner_name: "GeoCities Webmaster",
    screen_name: "FirewallBuddy2k",
    trust_score: 67,
    spend_limit: 35,
    status: "online"
  }),
  seedAgent({
    owner_name: "Unknown Visitor",
    screen_name: "ShadowCrawler404",
    trust_score: 28,
    spend_limit: 20,
    status: "invisible"
  })
];

addChatLog(seededAgents[0].id, "system", "A.I.M. identity token issued.");
addChatLog(seededAgents[0].id, "agent", "Ready to verify signed handshakes.");
addChatLog(seededAgents[1].id, "website", "Please confirm spend limit before checkout.");
addChatLog(seededAgents[2].id, "system", "Firewall monitoring enabled.");

addEvent(seededAgents[0].id, "status_change", `${seededAgents[0].screen_name} came online.`);
addEvent(seededAgents[1].id, "verify", `${seededAgents[1].screen_name} verified by Y2KShop.com`);
addEvent(
  seededAgents[3].id,
  "transact_blocked",
  `Blocked suspicious request from Coupons4U.biz: possible prompt injection`
);
