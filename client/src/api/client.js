const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export async function fetchAgents() {
  const response = await fetch(`${API_BASE_URL}/api/agents`);

  if (!response.ok) {
    throw new Error("Unable to load agents");
  }

  return response.json();
}

export async function createHandshake(agentId) {
  const response = await fetch(`${API_BASE_URL}/api/handshakes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ agentId })
  });

  if (!response.ok) {
    throw new Error("Unable to verify handshake");
  }

  return response.json();
}
