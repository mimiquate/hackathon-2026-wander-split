import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ResetForm } from "./ResetForm";

const { resetAction } = vi.hoisted(() => ({ resetAction: vi.fn() }));
vi.mock("./actions", () => ({ resetAction }));

function fillPasswords(password: string, confirmPassword: string) {
  fireEvent.change(screen.getByLabelText("Contraseña nueva"), { target: { value: password } });
  fireEvent.change(screen.getByLabelText("Confirmá la contraseña"), {
    target: { value: confirmPassword },
  });
}

describe("ResetForm", () => {
  it("shows the busy label and disables the submit button while pending", async () => {
    let resolveAction!: (value: object) => void;
    resetAction.mockReturnValue(new Promise((resolve) => (resolveAction = resolve)));
    render(<ResetForm token="a-token" />);

    fillPasswords("a-brand-new-password", "a-brand-new-password");
    fireEvent.click(screen.getByRole("button", { name: /Guardar contraseña/ }));

    const button = await screen.findByRole("button", { name: "Guardando…" });
    expect(button).toBeDisabled();

    resolveAction({});
    await screen.findByRole("button", { name: "Guardar contraseña" });
  });

  it("renders the mismatch error inline on the confirm field", async () => {
    resetAction.mockResolvedValue({ fieldErrors: { confirmPassword: "No coinciden. Escribila de nuevo." } });
    render(<ResetForm token="a-token" />);

    fillPasswords("a-brand-new-password", "does-not-match");
    fireEvent.click(screen.getByRole("button", { name: /Guardar contraseña/ }));

    expect(await screen.findByText("No coinciden. Escribila de nuevo.")).toBeInTheDocument();
  });

  it("renders a banner for a stale/invalid token error", async () => {
    resetAction.mockResolvedValue({ formError: "Este enlace ya no es válido. Pedí uno nuevo." });
    render(<ResetForm token="a-token" />);

    fillPasswords("a-brand-new-password", "a-brand-new-password");
    fireEvent.click(screen.getByRole("button", { name: /Guardar contraseña/ }));

    expect(
      await screen.findByText("Este enlace ya no es válido. Pedí uno nuevo."),
    ).toBeInTheDocument();
  });

  it("carries the token through as a hidden field", () => {
    resetAction.mockResolvedValue({});
    const { container } = render(<ResetForm token="the-real-token" />);

    const hidden = container.querySelector('input[name="token"]') as HTMLInputElement;
    expect(hidden.value).toEqual("the-real-token");
  });
});
