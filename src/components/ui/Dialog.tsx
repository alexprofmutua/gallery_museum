import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { clearInput } from "../../engine/input";
export function Dialog({
  title,
  onClose,
  children,
  className = "",
  dismissOnBackdrop = true,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  dismissOnBackdrop?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    clearInput();
    const previous = document.activeElement as HTMLElement | null;
    const element = ref.current;
    element?.showModal();
    return () => {
      element?.close?.();
      clearInput();
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`dialog ${className}`}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (dismissOnBackdrop && e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog-inner">
        <button
          className="icon-button close"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>
        {children}
      </div>
    </dialog>
  );
}
