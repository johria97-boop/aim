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

function clampTrustScore(score) {
  return Math.max(0, Math.min(100, Number(score)));
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
  addEvent(agent.id, "verify", `${agent.screen_name} identity created for ${owner_name}.`);

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

export function addChatLog(agent_id, from, text) {
  if (!findAgentById(agent_id)) {
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
  return message;
}

export function getChatLogsForAgent(agent_id) {
  return chatLogs
    .filter((message) => message.agent_id === agent_id)
    .sort((left, right) => new Date(left.timestamp) - new Date(right.timestamp));
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

createAgent("A.I.M. Demo User");
createAgent("Hackathon Judge");
createAgent("GeoCities Webmaster");

agents[1].status = "away";
agents[2].status = "invisible";
agents[2].trust_score = clampTrustScore(42);

addChatLog(agents[0].id, "system", "A.I.M. identity token issued.");
addChatLog(agents[0].id, "agent", "Ready to verify signed handshakes.");
addChatLog(agents[1].id, "website", "Please confirm spend limit before checkout.");
