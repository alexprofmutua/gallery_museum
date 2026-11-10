import { useEffect, useRef, useState } from "react";
import { portraits } from "../../content/portraits";
import { usePortraitVisit } from "../../stores/portraitVisit";
import { Dialog } from "./Dialog";

export function PortraitLibrary() {
  const activate = usePortraitVisit((state) => state.activate);
  return (
    <details className="portrait-library">
      <summary>Living Portrait Corridor</summary>
      <ul>
        {portraits.map((portrait) => (
          <li key={portrait.id}>
            <img src={portrait.thumbnail} alt="" loading="lazy" />
            <div>
              <strong>{portrait.title}</strong>
              <p>{portrait.description}</p>
              <button
                className="text-button"
                onClick={() => activate(portrait.id, "collection")}
              >
                Play {portrait.title}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </details>
  );
}

function PortraitControls({
  video,
  close,
  expand,
}: {
  video: HTMLVideoElement;
  close: () => void;
  expand?: () => void;
}) {
  const [playing, setPlaying] = useState(() => !video.paused);
  const [muted, setMuted] = useState(video.muted);
  const [error, setError] = useState("");
  const play = () => {
    setError("");
    void video.play().catch(() => {
      if (video.getAttribute("src"))
        setError("Playback couldn’t resume. Try Play again.");
    });
  };
  useEffect(() => {
    const updatePlaying = () => setPlaying(!video.paused);
    const updateMuted = () => setMuted(video.muted);
    video.addEventListener("play", updatePlaying);
    video.addEventListener("pause", updatePlaying);
    video.addEventListener("volumechange", updateMuted);
    return () => {
      video.removeEventListener("play", updatePlaying);
      video.removeEventListener("pause", updatePlaying);
      video.removeEventListener("volumechange", updateMuted);
    };
  }, [video]);
  return (
    <>
      <div
        className="portrait-actions"
        aria-label="Portrait playback controls"
        role="group"
      >
        <button onClick={() => (playing ? video.pause() : play())}>
          {playing ? "Pause" : "Resume"}
        </button>
        <button
          onClick={() => {
            video.muted = !video.muted;
          }}
        >
          {muted ? "Unmute" : "Mute"}
        </button>
        <button
          onClick={() => {
            video.currentTime = 0;
            play();
          }}
        >
          Replay
        </button>
        {expand && <button onClick={expand}>Expand video</button>}
        <button onClick={close}>Stop</button>
      </div>
      {error && <p role="status">{error}</p>}
    </>
  );
}

function HtmlVideo({
  video,
  hidden = false,
}: {
  video: HTMLVideoElement;
  hidden?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = host.current;
    if (!container) return;
    video.controls = !hidden;
    container.append(video);
    return () => {
      video.controls = false;
      video.remove();
    };
  }, [hidden, video]);
  return (
    <div
      ref={host}
      className={hidden ? "portrait-video-source" : "portrait-html-video"}
      aria-hidden={hidden || undefined}
    />
  );
}

export function PortraitPlayback() {
  const session = usePortraitVisit((state) => state.session);
  if (!session) return null;
  return <ActivePortrait key={session.portrait.id} {...session} />;
}

function ActivePortrait({
  portrait,
  video,
  location,
}: NonNullable<ReturnType<typeof usePortraitVisit.getState>["session"]>) {
  const close = usePortraitVisit((state) => state.close);
  const [expanded, setExpanded] = useState(location === "collection");
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    if (location !== "corridor") return;
    panel.current?.querySelector("button")?.focus({ preventScroll: true });
  }, [location]);
  if (expanded) {
    const collapse = () =>
      location === "collection" ? close() : setExpanded(false);
    return (
      <Dialog
        title={portrait.title}
        onClose={collapse}
        className="portrait-dialog"
      >
        <h2>{portrait.title}</h2>
        <p>{portrait.description}</p>
        <HtmlVideo video={video} />
        <PortraitControls video={video} close={close} />
        {location === "corridor" && (
          <button className="text-button" onClick={collapse}>
            Return to frame
          </button>
        )}
      </Dialog>
    );
  }
  return (
    <section ref={panel} className="portrait-panel" aria-label={portrait.title}>
      <strong>{portrait.title}</strong>
      <HtmlVideo video={video} hidden />
      <PortraitControls
        video={video}
        close={close}
        expand={() => setExpanded(true)}
      />
    </section>
  );
}
