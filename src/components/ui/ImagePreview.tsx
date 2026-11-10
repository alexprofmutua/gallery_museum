import { assetUrl } from "../../content/museum";
import { useState } from "react";
import type { Memory } from "../../content/museum";
export function ImagePreview({
  memory,
  eager = false,
}: {
  memory: Memory;
  eager?: boolean;
}) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  return (
    <div className="media-preview" data-media-state={status}>
      {status !== "error" && (
        <img
          src={assetUrl(memory.image)}
          alt={memory.alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setStatus("ready")}
          onError={() => setStatus("error")}
          style={{ visibility: status === "ready" ? "visible" : "hidden" }}
        />
      )}
      {status === "loading" && (
        <span className="media-status" aria-hidden="true">
          Loading image…
        </span>
      )}
      {status === "error" && (
        <p className="media-status" role={eager ? "status" : undefined}>
          Image unavailable. Your memory is still here.
        </p>
      )}
    </div>
  );
}
