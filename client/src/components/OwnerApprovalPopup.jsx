import { useEffect, useRef, useState } from "react";

const API_BASE_URL = "http://localhost:5000";
const DING_SOUND =
  "data:audio/wav;base64,UklGRkgAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YSQAAACAgP///wAAAP//AAD//wAAAP8AAID/AAAA//8AAP//AAD//wAA";
const WARNING_ICON = "\u26A0\uFE0F";
const APPROVE_ICON = "\u2705";
const DENY_ICON = "\u274C";

function OwnerApprovalPopup({
  agents = [],
  demoMode = false,
  onBackendError,
  onResolved,
  pendingApprovals = []
}) {
  const [isResolving, setIsResolving] = useState(false);
  const [showLoadingLine, setShowLoadingLine] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const previousCountRef = useRef(0);
  const resolveTimerRef = useRef(null);
  const resolveIntervalRef = useRef(null);
  const soundRef = useRef(null);
  const approval = pendingApprovals[0];
  const agent = agents.find((item) => item.id === approval?.agent_id);

  useEffect(() => {
    soundRef.current = new Audio(DING_SOUND);
    soundRef.current.volume = 0.16;
  }, []);

  useEffect(() => {
    const previousCount = previousCountRef.current;

    if (pendingApprovals.length > previousCount) {
      soundRef.current?.play().catch(() => {});
    }

    previousCountRef.current = pendingApprovals.length;
  }, [pendingApprovals.length]);

  useEffect(() => {
    return () => {
      window.clearTimeout(resolveTimerRef.current);
      window.clearInterval(resolveIntervalRef.current);
    };
  }, []);

  if (!approval) {
    return null;
  }

  function clearResolveTimers() {
    window.clearTimeout(resolveTimerRef.current);
    window.clearInterval(resolveIntervalRef.current);
    resolveTimerRef.current = null;
    resolveIntervalRef.current = null;
  }

  function startResolveTimer(approvalId, decision) {
    clearResolveTimers();
    setLoadingProgress(0);

    resolveIntervalRef.current = window.setInterval(() => {
      setLoadingProgress((current) => Math.min(100, current + 2));
    }, 100);

    resolveTimerRef.current = window.setTimeout(() => {
      clearResolveTimers();
      onResolved?.(approvalId, decision);
    }, 5000);
  }

  async function handleDecision(decision) {
    setIsResolving(true);
    setShowLoadingLine(true);

    try {
      if (!demoMode) {
        const response = await fetch(`${API_BASE_URL}/approve/${approval.id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ decision })
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Could not resolve approval");
        }
      }

      startResolveTimer(approval.id, decision);
    } catch (err) {
      console.error("[OwnerApprovalPopup] failed to resolve approval", err);
      onBackendError?.();
      setIsResolving(false);
      setShowLoadingLine(false);
      setLoadingProgress(0);
    }
  }

  return (
    <div className="owner-approval-overlay" role="presentation">
      <section
        aria-labelledby="owner-approval-title"
        aria-modal="true"
        className="y2k-window owner-approval-popup"
        role="dialog"
      >
        <header className="y2k-titlebar">
          <span id="owner-approval-title">{WARNING_ICON} Approval Needed</span>
          <span className="y2k-window-controls" aria-hidden="true">
            <span className="y2k-window-control is-minimize" />
            <span className="y2k-window-control is-maximize" />
            <span className="y2k-window-control is-close" />
          </span>
        </header>

        <div className="y2k-window-body owner-approval-body">
          <p>
            Your agent <strong>{agent?.screen_name || "UnknownAgent"}</strong> wants to spend{" "}
            <strong>${approval.amount}</strong> at <strong>{approval.site_name}</strong>. Approve?
          </p>
          <p className="owner-approval-note">{approval.request_note}</p>

          <div className="owner-approval-actions">
            <button
              className="y2k-button"
              disabled={isResolving}
              onClick={() => handleDecision("approved")}
              type="button"
            >
              {APPROVE_ICON} Approve
            </button>
            <button
              className="y2k-button"
              disabled={isResolving}
              onClick={() => handleDecision("denied")}
              type="button"
            >
              {DENY_ICON} Deny
            </button>
          </div>

          {(showLoadingLine || isResolving) && (
            <div className="owner-approval-loading">
              <div className="owner-approval-loading-track">
                <div
                  className="owner-approval-loading-line"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              <span className="owner-approval-loading-label">Processing approval…</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default OwnerApprovalPopup;
