import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Dialog } from "./Dialog";

describe("Dialog", () => {
  it("is not visible when closed", () => {
    render(
      <Dialog open={false} onClose={vi.fn()} title="Invitá a tu grupo">
        <p>contenido</p>
      </Dialog>,
    );
    expect(screen.queryByText("contenido")).not.toBeVisible();
  });

  it("shows its content and title when open", () => {
    render(
      <Dialog open={true} onClose={vi.fn()} title="Invitá a tu grupo">
        <p>contenido</p>
      </Dialog>,
    );
    expect(screen.getByText("contenido")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Invitá a tu grupo" })).toBeInTheDocument();
  });

  it("calls onClose when the close button is clicked", () => {
    const onClose = vi.fn();
    render(
      <Dialog open={true} onClose={onClose} title="Invitá a tu grupo">
        <p>contenido</p>
      </Dialog>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose on the native cancel event (Escape)", () => {
    const onClose = vi.fn();
    const { container } = render(
      <Dialog open={true} onClose={onClose} title="Invitá a tu grupo">
        <p>contenido</p>
      </Dialog>,
    );
    fireEvent(container.querySelector("dialog") as Element, new Event("cancel"));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when the backdrop is clicked, not when the content is clicked", () => {
    const onClose = vi.fn();
    const { container } = render(
      <Dialog open={true} onClose={onClose} title="Invitá a tu grupo">
        <p>contenido</p>
      </Dialog>,
    );

    fireEvent.click(screen.getByText("contenido"));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(container.querySelector("dialog") as Element);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
