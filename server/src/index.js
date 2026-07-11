import cors from "cors";
import express from "express";
import { agents, handshakes } from "./store.js";

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: CLIENT_ORIGIN
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "A.I.M. Agent Identity Manager",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/agents", (_req, res) => {
  res.json({ agents });
});

app.get("/api/agents/:id", (req, res) => {
  const agent = agents.find((item) => item.id === req.params.id);

  if (!agent) {
    return res.status(404).json({ error: "Agent not found" });
  }

  return res.json({ agent });
});

app.post("/api/agents", (req, res) => {
  const { screenName, owner, capabilities = [] } = req.body;

  if (!screenName || !owner) {
    return res.status(400).json({ error: "screenName and owner are required" });
  }

  const agent = {
    id: `aim-${String(agents.length + 1).padStart(3, "0")}`,
    screenName,
    owner,
    status: "online",
    trustScore: 75,
    capabilities,
    lastHandshake: new Date().toISOString()
  };

  agents.push(agent);
  return res.status(201).json({ agent });
});

app.post("/api/handshakes", (req, res) => {
  const { agentId } = req.body;
  const agent = agents.find((item) => item.id === agentId);

  if (!agent) {
    return res.status(404).json({ error: "Agent not found" });
  }

  agent.lastHandshake = new Date().toISOString();

  const handshake = {
    id: `hs-${String(7342 + handshakes.length + 1).padStart(6, "0")}`,
    agentId,
    result: agent.trustScore >= 70 ? "verified" : "blocked",
    message:
      agent.trustScore >= 70
        ? "Signed identity handshake accepted."
        : "Identity confidence too low. Connection blocked."
  };

  handshakes.unshift(handshake);
  return res.status(201).json({ handshake, agent });
});

app.get("/api/handshakes", (_req, res) => {
  res.json({ handshakes });
});

app.listen(PORT, () => {
  console.log(`A.I.M. server listening on http://localhost:${PORT}`);
  console.log(`CORS enabled for ${CLIENT_ORIGIN}`);
});
