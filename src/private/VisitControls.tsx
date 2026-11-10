import type { PrivateVisit } from "./session";

export const visitStatus = {
  off: "Solo visit",
  connecting: "Connecting…",
  waiting: "Waiting for your guest",
  together: "Visiting together",
  reconnecting: "Reconnecting… you can keep exploring",
};

export function VisitControls({
  visit,
  enabled,
  ready,
  status,
  toggle,
}: {
  visit: PrivateVisit;
  enabled: boolean;
  ready: boolean;
  status: keyof typeof visitStatus;
  toggle: () => void;
}) {
  const invite = new URL(window.location.pathname, window.location.origin);
  invite.searchParams.set("visit", "together");
  return (
    <section className="visit-together">
      <h3>Visit together</h3>
      <p>
        Share the link with your invited guest. Each person signs in with their
        own email.
      </p>
      <input
        readOnly
        aria-label="Private visit link"
        value={invite.href}
        onFocus={(event) => event.target.select()}
      />
      <p role="status">
        {enabled && !ready
          ? "Shared visits start when you enter the 3D museum."
          : visitStatus[status]}
      </p>
      <button className="setting-row" onClick={toggle}>
        {enabled ? "Leave shared visit" : "Join shared visit"}
      </button>
      <button className="text-button" onClick={() => void visit.signOut()}>
        Sign out
      </button>
    </section>
  );
}
