import "./room-ui.css";
import { Component, Suspense, lazy, useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Accessibility,
  RotateCcw,
  Settings2,
  Compass,
  Image,
  Footprints,
  UserRound,
  X,
  Film,
  Sparkles,
} from "lucide-react";
import { CharacterPicker } from "../components/ui/CharacterPicker";
import { portraits } from "../content/portraits";
import { usePortraitVisit } from "../stores/portraitVisit";
import { PortraitPlayback } from "../components/ui/PortraitPlayback";
import { rooms } from "../content/layout";
import { museum } from "../content/museum";
import { useMuseum } from "../stores/museum";
import { TouchControls } from "../components/ui/TouchControls";
import { Dialog } from "../components/ui/Dialog";
import { Collection } from "../components/ui/Collection";
import { MuseumMap } from "../components/ui/MuseumMap";
import { MemoryDetail } from "../components/ui/MemoryDetail";
import { Cinema } from "../components/ui/Cinema";
import { FinalLetter } from "../components/ui/FinalLetter";
import { letterPedestal } from "../content/foreverRoom";
import { useMuseumMusic } from "../components/ui/useMuseumMusic";
import { useSharedVisit } from "../private/useSharedVisit";
import { VisitControls, visitStatus } from "../private/VisitControls";
import type { PrivateVisit } from "../private/session";
import { clearInput } from "../engine/input";
const World = lazy(() =>
  import("../components/museum/World").then((m) => ({ default: m.World })),
);
class SceneBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    console.error("Museum scene could not load:", error);
  }
  render() {
    return this.state.failed ? (
      <div className="scene-error">
        <h2>The gallery couldn’t load.</h2>
        <p>Your browser may not support this 3D experience.</p>
        <button
          className="primary"
          onClick={() => useMuseum.getState().setMode("2d")}
        >
          Open accessible gallery <ArrowRight size={18} />
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function App({ privateVisit }: { privateVisit?: PrivateVisit }) {
  const s = useMuseum();
  const [help, setHelp] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [hintsDismissed, setHintsDismissed] = useState(false);
  useEffect(() => {
    if (!s.moving || hintsDismissed) return;
    const timer = window.setTimeout(() => setHintsDismissed(true), 1800);
    return () => window.clearTimeout(timer);
  }, [s.moving, hintsDismissed]);
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const nearby = usePortraitVisit((state) => state.nearby);
  const portraitSession = usePortraitVisit((state) => state.session);
  const portraitMessage = usePortraitVisit((state) => state.message);
  const music = useMuseumMusic(
    s.feature === "cinema" || Boolean(portraitSession),
  );
  const nearbyPortrait = portraits.find((portrait) => portrait.id === nearby);
  const in3D = s.entered && s.mode === "3d";
  const [sharing, setSharing] = useState(
    () =>
      new URLSearchParams(window.location.search).get("visit") === "together",
  );
  const shared = useSharedVisit(privateVisit, sharing && in3D);
  const inCinema = in3D && s.currentRoom === "cinema";
  const inFinalRoom = in3D && s.currentRoom === "forever";
  useEffect(() => {
    if (s.feature !== "envelope") return;
    const timer = window.setTimeout(() => {
      const { feature, openFeature } = useMuseum.getState();
      if (feature === "envelope") openFeature("letter");
    }, letterPedestal.openingMs);
    return () => window.clearTimeout(timer);
  }, [s.feature]);

  const memory = museum.memories.find((m) => m.id === s.activeMemory);
  useEffect(() => {
    clearInput();
  }, [s.activeMemory, s.feature, s.settings, s.mode, help, mapOpen]);
  useEffect(() => {
    if (s.activeMemory || s.feature || s.settings || help)
      usePortraitVisit.getState().close();
  }, [s.activeMemory, s.feature, s.settings, help]);
  useEffect(() => {
    const stop = () => usePortraitVisit.getState().close();
    const onVisibility = () => {
      if (document.hidden) stop();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", stop);
    return () => {
      stop();
      usePortraitVisit.getState().setNearby(null);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", stop);
    };
  }, [s.mode, s.reset]);
  useEffect(() => {
    const escape = (e: KeyboardEvent) => {
      if (e.code === "Escape" && !document.fullscreenElement) {
        usePortraitVisit.getState().close();
        useMuseum.getState().closeMemory();
        useMuseum.getState().closeFeature();
        setHelp(false);
        setMapOpen(false);
        if (useMuseum.getState().settings)
          useMuseum.getState().toggleSettings();
      }
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, []);
  return (
    <main
      data-compact-ui={in3D || undefined}
      data-room={s.mode === "3d" ? s.currentRoom : undefined}
      data-screening={inCinema && s.feature === "cinema" ? true : undefined}
      data-portrait-playing={
        portraitSession?.location === "corridor" || undefined
      }
    >
      {s.mode === "3d" ? (
        <div className="world">
          <SceneBoundary>
            <Suspense
              fallback={<div className="loading">Preparing your gallery…</div>}
            >
              <World
                video={video}
                remote={privateVisit ? shared.remote : undefined}
                guestCharacter={shared.guestCharacter}
              />
            </Suspense>
          </SceneBoundary>
        </div>
      ) : (
        <Collection privateVisit={Boolean(privateVisit)} />
      )}
      <header className="header">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            s.resetPosition();
          }}
          aria-label="Our Forever Museum, return to starting position"
        >
          <span className="brand-mark">
            OF<span>M</span>
          </span>
          <span className="brand-copy">
            {in3D ? <><small>OUR FOREVER MUSEUM</small><strong>{rooms.find(room => room.id === s.currentRoom)?.title}</strong></> : <>OUR FOREVER<br /><b>MUSEUM</b></>}
          </span>
        </a>
        <div className="header-right">
          <button
            className="icon-button"
            onClick={s.toggleSettings}
            aria-label="Open settings"
            disabled={s.feature === "envelope"}
          >
            <Settings2 size={19} />
          </button>
        </div>
      </header>
      {!s.entered && s.mode === "3d" ? (
        <section className="welcome">
          <div className="welcome-copy">
            <span className="eyebrow">
              <span className="little-line" /> A PLACE FOR YOUR STORY
            </span>
            <h1>
              Some moments
              <br />
              deserve to last
              <br />
              <em>forever.</em>
            </h1>
            <p>
              {museum.dedication}
              <br />
              Step inside. Take your time.
            </p>
            <CharacterPicker selected={s.character} onChange={s.setCharacter} />
            <button className="primary" onClick={() => {
              s.enter();
              if (import.meta.env.MODE === "personal") music.start();
            }}>
              Enter the museum <ArrowRight size={19} />
            </button>
            <button className="text-button" onClick={() => {
              s.setMode("2d");
              if (import.meta.env.MODE === "personal") music.start();
            }}>
              Explore the accessible gallery <ArrowUpRight size={15} />
            </button>
          </div>
        </section>
      ) : null}
      {s.entered && s.mode === "3d" && (
        <>
          <button className="museum-navigation" aria-label="Open museum map" onClick={() => {
            document.exitPointerLock?.(); setMapOpen(true);
          }} disabled={s.feature === "envelope"}>
            <Compass size={17} />
            <span className="route-dots" aria-hidden="true">{rooms.map(room => <i key={room.id} className={room.id === s.currentRoom ? "is-current" : ""} />)}</span>
            <span>{rooms.findIndex(room => room.id === s.currentRoom) + 1} / {rooms.length}</span>
          </button>
          {s.view === "first" && <div className="reticle" aria-hidden="true" title="Blinded by your love">❤️</div>}
          {s.nearMemory && !s.activeMemory && !s.settings && (
            <button
              className="interact"
              onClick={() => s.openMemory(s.nearMemory!)}
            >
              <span className="key">E</span> View memory{" "}
              <ArrowUpRight size={16} />
            </button>
          )}
          {s.currentRoom === "corridor" &&
            !s.settings &&
            !help &&
            !s.feature &&
            nearbyPortrait &&
            portraitSession?.portrait.id !== nearbyPortrait.id && (
              <button
                className="interact portrait-trigger"
                aria-label={`Play Portrait: ${nearbyPortrait.title}`}
                onClick={() =>
                  usePortraitVisit
                    .getState()
                    .activate(nearbyPortrait.id, "corridor")
                }
              >
                <span className="portrait-keyboard">
                  Press <kbd>E</kbd> to play portrait
                </span>
                <span className="portrait-touch">Play Portrait ▶</span>
                <strong>{nearbyPortrait.title}</strong>
              </button>
            )}
          {!s.settings && (
            <>
              {inCinema && s.nearCinemaSeat && !help && (
                <button className="interact" onClick={s.sitInCinema}>
                  <span className="key">E</span> Sit down <Film size={17} />
                </button>
              )}
              {inFinalRoom && s.nearLetter && !help && (
                <button
                  className="interact letter-trigger"
                  aria-label="Open Letter"
                  aria-disabled={Boolean(s.feature)}
                  onClick={s.openEnvelope}
                >
                  <span className="portrait-keyboard">
                    Press <kbd>E</kbd> to open your letter
                  </span>
                  <span className="portrait-touch">Open Letter</span>
                  <Sparkles size={16} />
                </button>
              )}
            </>
          )}
          <TouchControls />
          <footer className="explore-footer">
            <button
              className="help-button"
              disabled={s.feature === "envelope"}
              onClick={() => {
                document.exitPointerLock?.();
                setHelp(true);
              }}
            >
              <Compass size={17} /> How to explore
            </button>
            <span className={`desktop-hint${hintsDismissed ? " is-dismissed" : ""}`} aria-hidden={hintsDismissed}>
              W A S D <span>move</span>
              <i /> MOUSE <span>click / drag to look</span>
              <i /> ESC <span>release</span>
            </span>
            <span className="walk-status">
              <Footprints size={15} />
              {privateVisit && sharing
                ? visitStatus[shared.status]
                : s.moving
                  ? "Exploring"
                  : "Take your time"}
            </span>
          </footer>
        </>
      )}
      {s.mode === "2d" && (
        <button
          className="return-3d"
          onClick={() => {
            s.setMode("3d");
            s.enter();
            if (import.meta.env.MODE === "personal") music.start();
          }}
        >
          Return to 3D museum <ArrowRight size={16} />
        </button>
      )}
      <PortraitPlayback />
      {portraitMessage && (
        <p className="portrait-message" role="status">
          {portraitMessage}
        </p>
      )}
      {memory && <MemoryDetail memory={memory} onClose={s.closeMemory} onNavigate={s.openMemory} />}
      {mapOpen && <MuseumMap onClose={() => setMapOpen(false)} />}
      {s.feature === "cinema" && (
        <Cinema
          sample={!privateVisit}
          projected={inCinema}
          registerVideo={setVideo}
          onClose={s.closeFeature}
        />
      )}
      {s.feature === "letter" && (
        <FinalLetter sample={!privateVisit} onClose={s.closeFeature} />
      )}
      {s.settings && (
        <Dialog title="Museum settings" onClose={s.toggleSettings}>
          <span className="eyebrow">MAKE YOURSELF AT HOME</span>
          <h2>Your visit</h2>
          <p>
            Five connected spaces and {museum.memories.length}{" "}
            {privateVisit ? "memories." : "sample memories."}
          </p>
          <CharacterPicker selected={s.character} onChange={s.setCharacter} />
          {in3D && (
            <button
              className="setting-row"
              onClick={s.toggleView}
              aria-pressed={s.view === "third"}
            >
              <UserRound size={20} />
              Show visitor character
              <span>{s.view === "third" ? "On" : "Off"}</span>
            </button>
          )}
          <button
            className="setting-row"
            onClick={() => s.setMode(s.mode === "3d" ? "2d" : "3d")}
          >
            <Accessibility size={20} />
            {s.mode === "3d"
              ? "Open accessible 2D gallery"
              : "Return to 3D museum"}
            <ArrowRight size={17} />
          </button>
          <button className="setting-row" onClick={s.resetPosition}>
            <RotateCcw size={20} />
            Reset walking position
            <ArrowRight size={17} />
          </button>
          <button
            className="setting-row"
            onClick={() => {
              s.toggleSettings();
              setHelp(true);
            }}
          >
            <Compass size={20} />
            Navigation guide
            <ArrowRight size={17} />
          </button>
          <button className="setting-row" onClick={s.resetProgress}>
            <RotateCcw size={20} />
            Reset viewed memories
            <span>
              {s.viewedIds.length} / {museum.memories.length}
            </span>
          </button>
          <div className="cinematic-settings">
            <label>
              <input
                type="checkbox"
                checked={music.enabled}
                onChange={music.toggle}
              />
              Museum music <kbd>M</kbd>
            </label>
            <label>
              Music volume
              <input
                aria-label="Music volume"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={music.volume}
                onChange={(event) =>
                  music.changeVolume(event.currentTarget.valueAsNumber)
                }
              />
            </label>
            {music.error && (
              <p role="status">
                Music couldn’t start. Try turning it on again.
              </p>
            )}
            <label>
              Graphics
              <select
                value={s.graphics}
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  if (value === "low" || value === "medium" || value === "high")
                    s.setGraphics(value);
                }}
              >
                <option value="low">Low</option>
                <option value="medium">Balanced (recommended)</option>
                <option value="high">High (live reflections and shadows)</option>
              </select>
            </label>
          </div>
          {privateVisit ? (
            <VisitControls
              visit={privateVisit}
              enabled={sharing}
              ready={in3D}
              status={shared.status}
              toggle={() => {
                const next = !sharing;
                const url = new URL(window.location.href);
                if (next) url.searchParams.set("visit", "together");
                else url.searchParams.delete("visit");
                window.history.replaceState(null, "", url);
                setSharing(next);
              }}
            />
          ) : (
            <p className="sample-note">This preview contains sample content.</p>
          )}
        </Dialog>
      )}
      {help && (
        <Dialog title="How to explore" onClose={() => setHelp(false)}>
          <span className="eyebrow">AT YOUR OWN PACE</span>
          <h2>How to explore</h2>
          <div className="instructions">
            <p>
              <Footprints /> Walk with W A S D or ↑ / ↓. Hold Shift to walk
              faster. Press V or use Settings to switch camera views. Doors open
              as you approach and stay open for your return.
            </p>
            <p>
              <Compass /> Click the room to look with your mouse. Drag to look
              if capture is unavailable, or scroll your trackpad to look around.
              Press Esc to release capture. The ← / → keys also turn the camera.
            </p>
            <p>
              <Image /> Walk toward the framed picture, then press E or tap
              “View memory”. Walk up to the cinema seats, then press E or tap
              “Sit down” to choose a film. In the Forever Room, press E when the
              letter prompt appears. Press M to toggle museum music.
            </p>
            <p>
              <Accessibility /> On touchscreens, use the left joystick to walk
              and swipe the room or drag the right look pad to look around. The 2D gallery is available in
              settings.
            </p>
          </div>
          <button className="primary" onClick={() => setHelp(false)}>
            Take a look around <X size={16} />
          </button>
        </Dialog>
      )}
    </main>
  );
}
