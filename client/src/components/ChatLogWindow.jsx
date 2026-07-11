import { useEffect, useRef, useState } from "react";

const API_BASE_URL = "http://localhost:5000";
const MESSAGE_SOUND =
  "data:audio/wav;base64,UklGRjQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YRAAAAAAAP//AAD//wAA//8AAP//AAD//wAA//8AAA==";
const SAVE_ICON = "\uD83D\uDCBE";
const ROBOT_ICON = "\uD83E\uDD16";
const GLOBE_ICON = "\uD83C\uDF10";
const CHAT_ICON = "\uD83D\uDCAC";
const POINT_LEFT_ICON = "\uD83D\uDC48";

function formatTimestamp(timestamp) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(new Date(timestamp));
}

function ChatMessage({ message }) {
  if (message.from === "system") {
    return (
      <div className="chat-log-system-message">
        <span>{message.text}</span>
        <time dateTime={message.timestamp}>{formatTimestamp(message.timestamp)}</time>
      </div>
    );
  }

  const isAgent = message.from === "agent";

  return (
    <div className={`chat-log-message ${isAgent ? "is-agent" : "is-website"}`}>
      {isAgent ? <span className="chat-log-avatar">{ROBOT_ICON}</span> : null}
      <div className={isAgent ? "chat-bubble-agent" : "chat-bubble-website"}>
        {message.text}
        <time dateTime={message.timestamp}>{formatTimestamp(message.timestamp)}</time>
      </div>
      {isAgent ? null : <span className="chat-log-avatar">{GLOBE_ICON}</span>}
    </div>
  );
}

function ChatLogWindow({ agent, demoChatLogs = {}, demoMode = false, onBackendError }) {
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const scrollRef = useRef(null);
  const previousMessageCountRef = useRef(0);
  const hasLoadedAgentRef = useRef(false);
  const soundRef = useRef(null);

  useEffect(() => {
    soundRef.current = new Audio(MESSAGE_SOUND);
    soundRef.current.volume = 0.18;
  }, []);

  useEffect(() => {
    previousMessageCountRef.current = 0;
    hasLoadedAgentRef.current = false;
    setMessages([]);
    setError("");

    if (!agent) {
      return undefined;
    }

    if (demoMode) {
      const nextMessages = demoChatLogs[agent.id] || [];
      setMessages(nextMessages);
      previousMessageCountRef.current = nextMessages.length;
      hasLoadedAgentRef.current = true;
      return undefined;
    }

    async function loadMessages() {
      const url = `${API_BASE_URL}/chatlogs/${agent.id}`;

      try {
        console.log("[ChatLogWindow] polling chatlogs", {
          agentId: agent.id,
          screenName: agent.screen_name,
          url
        });

        const response = await fetch(url);
        console.log("[ChatLogWindow] raw response", response);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Could not load conversation: ${response.status} ${response.statusText} ${errorText}`
          );
        }

        const data = await response.json();
        console.log("[ChatLogWindow] parsed chatlogs", {
          requestedAgentId: agent.id,
          count: Array.isArray(data) ? data.length : "non-array",
          data
        });

        const nextMessages = Array.isArray(data) ? data : [];
        const previousCount = previousMessageCountRef.current;

        setMessages(nextMessages);
        setError("");

        if (hasLoadedAgentRef.current && nextMessages.length > previousCount) {
          soundRef.current?.play().catch(() => {});
        }

        previousMessageCountRef.current = nextMessages.length;
        hasLoadedAgentRef.current = true;
      } catch (err) {
        console.error("[ChatLogWindow] failed to fetch chatlogs", {
          agentId: agent.id,
          url,
          error: err
        });
        setError(err.message);
        onBackendError?.();
      }
    }

    loadMessages();

    const pollId = window.setInterval(loadMessages, 2000);

    return () => window.clearInterval(pollId);
  }, [agent, demoChatLogs, demoMode, onBackendError]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [messages]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setToast(""), 1800);

    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  function getSpeakerName(message) {
    if (message.from === "agent") {
      return agent?.screen_name || "Agent";
    }

    if (message.from === "system") {
      return "SYSTEM";
    }

    return "Website";
  }

  function handleSaveConversation() {
    if (!agent || messages.length === 0) {
      return;
    }

    const savedAt = new Date();
    const header = [
      "A.I.M. Conversation Log",
      `Buddy: ${agent.screen_name}`,
      `Saved on: ${savedAt.toLocaleString()}`,
      "-----------------------------"
    ];
    const lines = messages.map(
      (message) =>
        `[${formatTimestamp(message.timestamp)}] ${getSpeakerName(message)}: ${message.text}`
    );
    const logText = [...header, ...lines].join("\n");
    const blob = new Blob([logText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const datePart = savedAt.toISOString().slice(0, 10);
    const safeScreenName = agent.screen_name.replace(/[^a-z0-9_-]/gi, "_");
    const link = document.createElement("a");

    link.href = url;
    link.download = `AIM_log_${safeScreenName}_${datePart}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setToast(`${SAVE_ICON} Conversation saved!`);
  }

  return (
    <section className="y2k-window chat-log-window">
      <header className="y2k-titlebar chat-log-titlebar">
        <span>
          {CHAT_ICON} Conversation with {agent?.screen_name || "..."}
        </span>
        <span className="chat-log-title-actions">
          <button
            className="y2k-button chat-log-save-button"
            disabled={!agent || messages.length === 0}
            onClick={handleSaveConversation}
            type="button"
          >
            {SAVE_ICON} Save Conversation
          </button>
          <span className="y2k-window-controls" aria-hidden="true">
            <span className="y2k-window-control is-minimize" />
            <span className="y2k-window-control is-maximize" />
            <span className="y2k-window-control is-close" />
          </span>
        </span>
      </header>

      <div className="y2k-window-body chat-log-body">
        {!agent ? (
          <p className="chat-log-placeholder">
            Select a buddy from the list to see their conversations{" "}
            <span className="blink-text">{POINT_LEFT_ICON}</span>
          </p>
        ) : (
          <>
            {error ? <p className="chat-log-error blink-text">{error}</p> : null}
            <div className="chat-log-messages retro-scrollbar" ref={scrollRef}>
              {messages.length > 0 ? (
                messages.map((message) => <ChatMessage key={message.id} message={message} />)
              ) : (
                <p className="chat-log-empty">No messages yet. This window is listening...</p>
              )}
            </div>
          </>
        )}
      </div>

      {toast ? <div className="chat-log-save-toast">{toast}</div> : null}
    </section>
  );
}

export default ChatLogWindow;
