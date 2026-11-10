import { cinematics } from "../../content/museum";
import { Dialog } from "./Dialog";

export function FinalLetter({
  sample = true,
  onClose,
}: {
  sample?: boolean;
  onClose: () => void;
}) {
  const { title, paragraphs, dedication } = cinematics.letter;
  return (
    <Dialog
      title="The Forever Room letter"
      className="final-letter"
      onClose={onClose}
    >
      <span className="eyebrow">
        THE FOREVER ROOM / {sample ? "SAMPLE LETTER" : "LETTER"}
      </span>
      <h2>{title}</h2>
      {paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      {dedication && <p className="letter-signoff">{dedication}</p>}
      <div className="cinematic-actions">
        <button className="primary" onClick={onClose}>
          Return to the museum
        </button>
      </div>
    </Dialog>
  );
}
