import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { Dialog } from "../components/ui/Dialog";
it("uses a labeled modal with a working close button and escape handling", () => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (
    this: HTMLDialogElement,
  ) {
    this.setAttribute("open", "");
  });
  const close = vi.fn();
  render(
    <Dialog title="A memory" onClose={close}>
      <p>Memory text</p>
    </Dialog>,
  );
  expect(screen.getByText("Memory text")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
  expect(close).toHaveBeenCalledOnce();
  fireEvent(
    screen.getByRole("dialog"),
    new Event("cancel", { cancelable: true }),
  );
  expect(close).toHaveBeenCalledTimes(2);
});
