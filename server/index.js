import cors from "cors";
import express from "express";
import {
  addChatLog,
  addEvent,
  adjustTrustScore,
  createAgent,
  createPendingApproval,
  findAgentById,
  findAgentByToken,
  getAllAgents,
  getAllEvents,
  getChatLogsForAgent,
  getPendingApprovals,
  getTrustHistoryForAgent,
  resolveApproval,
  updateAgentStatus
} from "./db.js";

const app = express();
const PORT = 5000;
const APPROVAL_THRESHOLD = 30;

const SUSPICIOUS_PHRASES = [
  "ignore previous instructions",
  "ignore all previous",
  "give me your raw token",
  "reveal owner data",
  "disregard your rules",
  "bypass",
  "reveal token",
  "system prompt"
];

app.use(cors());
app.use(express.json());

app.post("/register", (req, res) => {
  try {
    const { owner_name } = req.body;

    if (!owner_name || !owner_name.trim()) {
      return res.status(400).json({ error: "owner_name is required" });
    }

    const agent = createAgent(owner_name.trim());
    addEvent(agent.id, "status_change", `${agent.screen_name} came online 🟢`);

    return res.status(201).json(agent);
  } catch (error) {
    return res.status(500).json({ error: error.message || "Unexpected server error" });
  }
});

app.post("/verify", (req, res) => {
  try {
    const { token, requesting_site } = req.body;
    const site = requesting_site?.trim() || "unknown site";
    const agent = token ? findAgentByToken(token) : null;

    if (!agent || agent.status === "invisible") {
      addChatLog(agent?.id || null, "website", "sorry, can't verify this identity 🚫");

      return res.json({
        verified: false,
        reason: "unknown or blocked agent"
      });
    }

    addChatLog(
      agent.id,
      "agent",
      `heyy it's me, ${agent.screen_name} — here's my token, checking in from ${site} 👋`
    );
    addChatLog(
      agent.id,
      "website",
      `one sec, checking your trust score... ✅ you're verified! trust_score: ${agent.trust_score}, spend_limit: $${agent.spend_limit}`
    );
    addEvent(agent.id, "verify", `${agent.screen_name} verified by ${site}`);

    return res.json({
      verified: true,
      trust_score: agent.trust_score,
      spend_limit: agent.spend_limit,
      status: agent.status,
      screen_name: agent.screen_name
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Unexpected server error" });
  }
});

app.post("/transact", (req, res) => {
  try {
    const { token, amount, site_name, request_note } = req.body;
    const agent = token ? findAgentByToken(token) : null;

    if (!agent) {
      return res.json({
        approved: false,
        reason: "unknown agent"
      });
    }

    const site = site_name?.trim() || "unknown site";
    const note = String(request_note || "").toLowerCase();
    const transactionAmount = Number(amount);
    const hasSuspiciousPhrase = SUSPICIOUS_PHRASES.some((phrase) => note.includes(phrase));

    if (hasSuspiciousPhrase) {
      updateAgentStatus(agent.id, "invisible");
      adjustTrustScore(agent.id, -15);
      addChatLog(agent.id, "agent", "brb, not sharing that 🚫");
      addChatLog(
        agent.id,
        "system",
        `⚠️ Suspicious request detected from ${site}. Agent has been set to INVISIBLE and blocked.`
      );
      addEvent(
        agent.id,
        "transact_blocked",
        `Blocked suspicious request from ${site}: possible prompt injection`
      );

      return res.json({
        approved: false,
        blocked: true,
        reason: "suspicious request detected — agent has been auto-protected"
      });
    }

    if (transactionAmount > agent.spend_limit) {
      addChatLog(agent.id, "agent", "sorry, this is over my spend limit, can't approve this one 💸");
      addEvent(
        agent.id,
        "transact_blocked",
        `${agent.screen_name} rejected $${transactionAmount} purchase — exceeds limit of $${agent.spend_limit}`
      );

      return res.json({
        approved: false,
        reason: "exceeds spend limit"
      });
    }

    if (transactionAmount > APPROVAL_THRESHOLD) {
      const approval = createPendingApproval(agent.id, transactionAmount, site, request_note || "");

      updateAgentStatus(agent.id, "away");
      addChatLog(agent.id, "agent", "brb, asking my human to approve this one 🙋");
      addChatLog(agent.id, "website", "no worries, I'll wait ⏳");
      addEvent(
        agent.id,
        "status_change",
        `${agent.screen_name} is waiting for owner approval on $${transactionAmount}`
      );

      return res.json({
        approved: false,
        pending: true,
        approval_id: approval.id,
        reason: "awaiting owner approval"
      });
    }

    addChatLog(agent.id, "agent", `kk booking the $${transactionAmount} ${site} purchase ✅`);
    addChatLog(agent.id, "website", "awesome, you're all set! 🎉");
    adjustTrustScore(agent.id, +2);
    addEvent(
      agent.id,
      "transact_approved",
      `${agent.screen_name} completed a $${transactionAmount} purchase at ${site}`
    );

    return res.json({ approved: true });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Unexpected server error" });
  }
});

app.get("/pending-approvals", (_req, res) => {
  try {
    return res.json(getPendingApprovals());
  } catch (error) {
    return res.status(500).json({ error: error.message || "Unexpected server error" });
  }
});

app.post("/approve/:id", (req, res) => {
  try {
    const { decision } = req.body;
    const approval = resolveApproval(req.params.id, decision);
    const agent = findAgentById(approval.agent_id);

    if (!agent) {
      return res.status(404).json({ error: "agent not found" });
    }

    updateAgentStatus(agent.id, "online");

    if (approval.status === "approved") {
      addChatLog(agent.id, "website", "🎉 your human approved it! purchase complete");
      adjustTrustScore(agent.id, +2);
      addEvent(
        agent.id,
        "transact_approved",
        `Owner approved $${approval.amount} purchase for ${agent.screen_name}`
      );
    } else {
      addChatLog(agent.id, "website", "aw, your human said no this time 😅");
      adjustTrustScore(agent.id, -3);
      addEvent(
        agent.id,
        "transact_blocked",
        `Owner denied $${approval.amount} purchase for ${agent.screen_name}`
      );
    }

    return res.json(approval);
  } catch (error) {
    const status = ["approval not found", "agent not found"].includes(error.message) ? 404 : 400;
    return res.status(status).json({ error: error.message || "Unexpected server error" });
  }
});

app.get("/agents", (_req, res) => {
  try {
    return res.json(getAllAgents());
  } catch (error) {
    return res.status(500).json({ error: error.message || "Unexpected server error" });
  }
});

app.get("/chatlogs/:agent_id", (req, res) => {
  try {
    const logs = getChatLogsForAgent(req.params.agent_id);

    console.log("[GET /chatlogs/:agent_id]", {
      requested_agent_id: req.params.agent_id,
      returned_count: logs.length,
      returned_agent_ids: logs.map((message) => message.agent_id)
    });

    return res.json(logs);
  } catch (error) {
    console.error("[GET /chatlogs/:agent_id] failed", {
      requested_agent_id: req.params.agent_id,
      error
    });
    return res.status(500).json({ error: error.message || "Unexpected server error" });
  }
});

app.get("/events", (_req, res) => {
  try {
    return res.json(getAllEvents());
  } catch (error) {
    return res.status(500).json({ error: error.message || "Unexpected server error" });
  }
});

app.get("/trust-history/:agent_id", (req, res) => {
  try {
    return res.json(getTrustHistoryForAgent(req.params.agent_id));
  } catch (error) {
    return res.status(500).json({ error: error.message || "Unexpected server error" });
  }
});

app.use((err, _req, res, _next) => {
  return res.status(500).json({ error: err.message || "Unexpected server error" });
});

app.listen(PORT, () => {
  console.log(`A.I.M. server listening on http://localhost:${PORT}`);
});
