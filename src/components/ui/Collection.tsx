import { useState } from "react";
import { ArrowUpRight, Search, Check, Film, Sparkles } from "lucide-react";
import { assetUrl, museum, formatMemoryDate, formatMemoryNumber } from "../../content/museum";
import { foreverQuotes } from "../../content/foreverRoom";
import { useMuseum } from "../../stores/museum";
import { PortraitLibrary } from "./PortraitPlayback";
import { ImagePreview } from "./ImagePreview";
export function Collection({
  privateVisit = false,
}: {
  privateVisit?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [unseen, setUnseen] = useState(false);
  const viewed = useMuseum((s) => s.viewedIds);
  const open = useMuseum((s) => s.openMemory);
  const openFeature = useMuseum((s) => s.openFeature);
  const filtered = museum.memories.filter(
    (m) =>
      (!unseen || !viewed.includes(m.id)) &&
      [m.title, m.caption, m.story, m.date ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase().trim()),
  );
  return (
    <section className="accessible-gallery">
      <span className="eyebrow">THE COLLECTION / ACCESSIBLE VIEW</span>
      <h1>The Gallery of Us</h1>
      <p>The same memories, at your own pace.</p>
      <nav className="collection-features" aria-label="Film and letter">
        <button className="text-button" onClick={() => openFeature("cinema")}>
          <Film size={17} /> Browse films
        </button>
        <button className="text-button" onClick={() => openFeature("letter")}>
          <Sparkles size={17} />{" "}
          {privateVisit ? "Read letter" : "Read sample letter"}
        </button>
      </nav>
      <details className="forever-quote-collection">
        <summary>Inscriptions from the Forever Room</summary>
        {foreverQuotes.map(({ text }) => (
          <figure key={text}>
            <blockquote>“{text}”</blockquote>
          </figure>
        ))}
      </details>
      {museum.entrance && (
        <details className="forever-quote-collection">
          <summary>At the museum entrance</summary>
          <p>{museum.entrance.description}</p>
          <video
            controls
            playsInline
            muted
            preload="none"
            poster={assetUrl(museum.entrance.poster)}
            src={assetUrl(museum.entrance.source)}
            style={{ maxWidth: "100%", maxHeight: "60dvh" }}
          />
        </details>
      )}
      {import.meta.env.MODE !== "personal" && !museum.memories.some((memory) => memory.roomId === "corridor") && (
        <PortraitLibrary />
      )}
      <div className="collection-toolbar">
        <label className="collection-search">
          <Search size={17} />
          <input
            type="search"
            aria-label="Search memories"
            value={query}
            placeholder="Find a memory…"
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label className="unseen-filter">
          <input
            type="checkbox"
            checked={unseen}
            onChange={(e) => setUnseen(e.target.checked)}
          />
          Unseen only
        </label>
        <span aria-live="polite">
          {viewed.length} / {museum.memories.length} viewed
        </span>
      </div>
      <div className="collection-grid">
        {filtered.map((m) => (
          <button
            key={m.id}
            data-testid={`memory-card-${m.id}`}
            className="gallery-item"
            onClick={() => open(m.id)}
          >
            <ImagePreview memory={m} />
            <span>
              <small>
                {formatMemoryNumber(m)} /{" "}
                {m.placeholder
                  ? "PLACEHOLDER"
                  : m.section === "graduation"
                    ? "THE GRADUATE"
                  : m.roomId === "corridor"
                    ? "ENCHANTED HALLWAY"
                    : "MEMORY"}
                {viewed.includes(m.id) && (
                  <Check size={13} aria-label="Viewed" />
                )}
              </small>
              <strong>{m.title}</strong>
              {m.date && (
                <time dateTime={m.date}>{formatMemoryDate(m.date)}</time>
              )}
              <span>{m.caption}</span>
              <span>
                Read the memory <ArrowUpRight size={16} />
              </span>
            </span>
          </button>
        ))}
      </div>
      {!filtered.length && (
        <p className="collection-empty" role="status">
          No memories match this view. Try another search or turn off “Unseen
          only”.
        </p>
      )}
      <p className="sample-note">
        {privateVisit
          ? "Viewed progress lasts for this visit."
          : "Sample artwork and text, ready for your collection. Viewed progress stays in this browser."}
      </p>
    </section>
  );
}
