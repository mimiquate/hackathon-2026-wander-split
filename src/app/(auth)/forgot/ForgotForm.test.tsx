import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ForgotForm } from "./ForgotForm";

const { forgotAction } = vi.hoisted(() => ({ forgotAction: vi.fn() }));
vi.mock("./actions", () => ({ forgotAction }));

describe("ForgotForm", () => {
  it("shows the busy label and disables the submit button while pending", async () => {
    let resolveAction!: (value: object) => void;
    forgotAction.mockReturnValue(new Promise((resolve) => (resolveAction = resolve)));
    render(<ForgotForm />);

    fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "juan@correo.com" } });
    fireEvent.click(screen.getByRole("button", { name: /Enviar enlace/ }));

    const button = await screen.findByRole("button", { name: "Enviando…" });
    expect(button).toBeDisabled();

    resolveAction({ sent: true });
    await screen.findByText(/te mandamos un enlace/);
  });

  it("shows the confirmation panel after a resolved submit, regardless of the outcome", async () => {
    forgotAction.mockResolvedValue({ sent: true });
    render(<ForgotForm />);

    fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "nobody@correo.com" } });
    fireEvent.click(screen.getByRole("button", { name: /Enviar enlace/ }));

    expect(
      await screen.findByText(
        "Si ese correo tiene una cuenta, te mandamos un enlace para elegir una contraseña nueva.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Correo")).not.toBeInTheDocument();
  });

  it("links back to /login", () => {
    render(<ForgotForm />);
    expect(screen.getByRole("link", { name: "Entrá" })).toHaveAttribute("href", "/login");
  });
});
