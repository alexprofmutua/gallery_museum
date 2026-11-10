import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Film } from "lucide-react";
import { assetUrl, cinematics } from "../../content/museum";
import type { CinemaFilm } from "../../content/museum";
import { Dialog } from "./Dialog";

export function Cinema({
  sample,
  projected,
  registerVideo,
  onClose,
}: CinemaProps) {
  const [selected, setSelected] = useState<CinemaFilm | null>(null);
  const list = useRef<HTMLUListElement>(null);
  const scroll = useRef(0);
  const previousChoice = useRef<number | null>(null);
  useEffect(() => {
    if (!selected) {
      const frame = requestAnimationFrame(() => {
        if (!list.current) return;
        list.current.scrollTop = scroll.current;
        list.current.querySelector<HTMLButtonElement>(`[data-film-index="${previousChoice.current}"]`)
          ?.focus({ preventScroll: true });
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [selected]);

  if (selected)
    return (
      <FilmPlayer
        film={selected}
        sample={sample}
        projected={projected}
        registerVideo={registerVideo}
        onClose={onClose}
        onBrowse={() => setSelected(null)}
      />
    );

  return (
    <Dialog
      title="Our Little Cinema"
      className={
        projected ? "projection-dialog cinema-picker" : "cinema-picker"
      }
      onClose={onClose}
    >
      <span className="eyebrow">
        OUR LITTLE CINEMA{projected ? " / SEATED" : ""}
      </span>
      <h2>Choose a film</h2>
      <p className="cinema-library-note">Our collection <span aria-hidden="true">·</span> {1 + cinematics.additionalFilms.length} films to revisit</p>
      <ul ref={list} className="cinema-films" aria-label="Available films">
        {[cinematics.film, ...cinematics.additionalFilms].map((film, index) => (
          <li key={index}>
            <button
              data-film-index={index}
              aria-label={`Select ${film.title}`}
              onClick={() => {
                scroll.current = list.current?.scrollTop ?? 0;
                previousChoice.current = index;
                setSelected(film);
              }}
            >
              <span className="cinema-cover">
                <img src={assetUrl(film.poster)} alt="" loading={index < 6 ? "eager" : "lazy"} decoding="async" />
                {film.durationSeconds && <span className="film-duration">{formatDuration(film.durationSeconds)}</span>}
                <span className="film-hover" aria-hidden="true"><Play size={24} fill="currentColor" /> Select film</span>
              </span>
              <span className="cinema-card-copy">
                <strong>{film.title}</strong>
                <small><Film size={12} aria-hidden="true" /> OUR COLLECTION <span className="sr-only">{film.description}</span></small>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <button className="text-button cinema-return" onClick={onClose}>
        {projected ? "Stand up" : "Return to the museum"}
      </button>
    </Dialog>
  );
}

function formatDuration(seconds: number) {
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60), remainder = String(total % 60).padStart(2, "0");
  return `${minutes}:${remainder}`;
}

type CinemaProps = {
  sample?: boolean;
  projected: boolean;
  registerVideo: (video: HTMLVideoElement | null) => void;
  onClose: () => void;
};

function FilmPlayer({
  film,
  sample = true,
  projected,
  registerVideo,
  onClose,
  onBrowse,
}: CinemaProps & {
  film: CinemaFilm;
  onBrowse: () => void;
}) {
  const video = useRef<HTMLVideoElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [inline, setInline] = useState(!projected);
  const [duration, setDuration] = useState(0);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [captions, setCaptions] = useState(true);
  const [cue, setCue] = useState("");
  const [failed, setFailed] = useState(false);
  const [notice, setNotice] = useState("");
  const [controlsVisible, setControlsVisible] = useState(true);
  const attachVideo = useCallback(
    (element: HTMLVideoElement | null) => {
      if (!element) video.current?.pause();
      video.current = element;
      registerVideo(element);
    },
    [registerVideo],
  );

  const togglePlayback = () => {
    const element = video.current;
    if (!element) return;
    if (element.paused) {
      setNotice("");
      void element.play().catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        setNotice("Playback couldn’t start. Try Play again.");
      });
    } else element.pause();
  };

  const fullscreen = async () => {
    const element = video.current;
    if (!element) return;
    const nativeVideo = element as HTMLVideoElement & {
      webkitEnterFullscreen?: () => void;
    };
    try {
      if (element.requestFullscreen) await element.requestFullscreen();
      else if (nativeVideo.webkitEnterFullscreen)
        nativeVideo.webkitEnterFullscreen();
      else {
        setInline(true);
        setNotice("Fullscreen is unavailable. The inline player is open.");
      }
    } catch {
      setInline(true);
      setNotice("Fullscreen is unavailable. The inline player is open.");
    }
  };

  const projectedView = !inline && !failed;
  useEffect(() => {
    if (!projectedView || !projected) return;
    let timer = 0;
    const reveal = () => {
      setControlsVisible(true);
      window.clearTimeout(timer);
      if (playing) timer = window.setTimeout(() => setControlsVisible(false), 2500);
    };
    reveal();
    window.addEventListener("pointermove", reveal, { passive: true });
    window.addEventListener("touchstart", reveal, { passive: true });
    window.addEventListener("keydown", reveal);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointermove", reveal);
      window.removeEventListener("touchstart", reveal);
      window.removeEventListener("keydown", reveal);
    };
  }, [projectedView, projected, playing]);
  useEffect(() => {
    const element = video.current;
    const track = element?.textTracks[0];
    if (!element || !projected) return;
    const fullscreenChange = () =>
      setIsFullscreen(document.fullscreenElement === element);
    const cueChange = () => {
      setCue(
        Array.from(
          track?.activeCues ?? [],
          (item) => (item as VTTCue).text,
        ).join(" "),
      );
    };
    element.addEventListener("fullscreenchange", fullscreenChange);
    track?.addEventListener("cuechange", cueChange);
    return () => {
      element.removeEventListener("fullscreenchange", fullscreenChange);
      track?.removeEventListener("cuechange", cueChange);
    };
  }, [projected]);

  useEffect(() => {
    const track = video.current?.textTracks[0];
    if (projected && track)
      track.mode = captions
        ? projectedView && !isFullscreen
          ? "hidden"
          : "showing"
        : "disabled";
  }, [captions, isFullscreen, projected, projectedView]);
  return (
    <Dialog
      title="Our Little Cinema"
      className={projectedView ? `projection-dialog film-hud${controlsVisible ? "" : " controls-hidden"}` : "cinema-dialog"}
      dismissOnBackdrop={!projectedView}
      onClose={onClose}
    >
      <span className="eyebrow">
        OUR LITTLE CINEMA / {sample && !film.personal ? "SAMPLE FILM" : "FILM"}
      </span>
      <h2>{film.title}</h2>
      <video
        ref={attachVideo}
        className={projectedView ? "projected-video" : "inline-video"}
        aria-label={film.title}
        controls={!projectedView || isFullscreen}
        preload="metadata"
        crossOrigin="anonymous"
        playsInline
        poster={assetUrl(film.poster)}
        src={assetUrl(film.source)}
        onLoadedMetadata={(event) => {
          const element = event.currentTarget;
          setDuration(Number.isFinite(element.duration) ? element.duration : 0);
        }}
        onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onVolumeChange={(event) => setMuted(event.currentTarget.muted)}
        onError={() => setFailed(true)}
      >
        <track
          default
          kind="captions"
          label="English"
          srcLang="en"
          src={assetUrl(film.captions)}
        />
      </video>
      {projectedView && (
        <>
          {captions && cue && <div className="projection-caption">{cue}</div>}
          <div className="projection-controls">
            <button className="film-control" onClick={togglePlayback}>
              {playing ? "Pause" : "Play"}
            </button>
            <input
              aria-label="Film position"
              type="range"
              min="0"
              max={duration || 1}
              step="0.1"
              disabled={!duration}
              value={time}
              onChange={(event) => {
                const next = event.currentTarget.valueAsNumber;
                if (video.current) video.current.currentTime = next;
                setTime(next);
              }}
            />
            <button
              className="film-control"
              onClick={() => {
                if (video.current) video.current.muted = !video.current.muted;
              }}
            >
              {muted ? "Unmute film" : "Mute film"}
            </button>
            <button
              className="film-control"
              aria-pressed={captions}
              onClick={() => setCaptions(!captions)}
            >
              Captions
            </button>
            <button className="film-control" onClick={() => void fullscreen()}>
              Fullscreen
            </button>
          </div>
        </>
      )}
      {!projectedView && <p>{film.description}</p>}
      {notice && <p role="status">{notice}</p>}
      {failed && (
        <p role="alert">
          The film couldn’t load. You can still read the description or close
          the cinema and try again.
        </p>
      )}
      <div className="cinema-navigation">
        <button className="text-button" onClick={onBrowse}>
          Back to films
        </button>
        <button className="text-button" onClick={onClose}>
          {projected ? "Stand up" : "Return to the museum"}
        </button>
      </div>
    </Dialog>
  );
}
