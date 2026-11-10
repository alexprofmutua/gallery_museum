import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { ImagePreview } from "../components/ui/ImagePreview";
import { museum } from "../content/museum";
it("exposes a loading state, displays the image, and retains a readable error fallback", () => {
  const { container } = render(
    <ImagePreview memory={museum.memories[0]} eager />,
  );
  expect(container.firstChild).toHaveAttribute("data-media-state", "loading");
  fireEvent.load(screen.getByAltText(museum.memories[0].alt));
  expect(container.firstChild).toHaveAttribute("data-media-state", "ready");
  fireEvent.error(screen.getByAltText(museum.memories[0].alt));
  expect(screen.getByRole("status")).toHaveTextContent("Image unavailable");
  expect(container.firstChild).toHaveAttribute("data-media-state", "error");
});
