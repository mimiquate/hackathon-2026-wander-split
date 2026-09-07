import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SignupForm } from "./SignupForm";

const { signupAction } = vi.hoisted(() => ({ signupAction: vi.fn() }));
vi.mock("./actions", () => ({ signupAction }));

function fillFields(email: string, password: string) {
  fireEvent.change(screen.getByLabelText("Correo"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: password } });
}

function checkTerms() {
  fireEvent.click(screen.getByRole("checkbox"));
}

describe("SignupForm", () => {
  it("disables the submit button until the terms checkbox is checked", () => {
    render(<SignupForm />);
    fillFields("juan@correo.com", "a-real-password");
    expect(screen.getByRole("button", { name: "Crear cuenta" })).toBeDisabled();

    checkTerms();
    expect(screen.getByRole("button", { name: "Crear cuenta" })).not.toBeDisabled();
  });

  it("shows the busy label and disables the submit button while pending", async () => {
    let resolveAction!: (value: object) => void;
    signupAction.mockReturnValue(new Promise((resolve) => (resolveAction = resolve)));
    render(<SignupForm />);

    fillFields("juan@correo.com", "a-real-password");
    checkTerms();
    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));

    const button = await screen.findByRole("button", { name: "Creando tu cuenta…" });
    expect(button).toBeDisabled();

    resolveAction({});
    await screen.findByRole("button", { name: "Crear cuenta" });
  });

  it("renders the invalid-email error exactly", async () => {
    signupAction.mockResolvedValue({ fieldErrors: { email: "Ese correo no parece válido." } });
    render(<SignupForm />);

    // "juan@correo" (no TLD) passes the <input type="email"> field's own
    // native format check, so it's a realistic case for the server's
    // stricter validation to actually be reached — an obviously-malformed
    // value (no "@" at all) would never leave the browser.
    fillFields("juan@correo", "a-real-password");
    checkTerms();
    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(await screen.findByText("Ese correo no parece válido.")).toBeInTheDocument();
  });

  it("renders the too-short-password error in place of the hint", async () => {
    signupAction.mockResolvedValue({ fieldErrors: { password: "Usá al menos 8 caracteres." } });
    render(<SignupForm />);

    fillFields("juan@correo.com", "short");
    checkTerms();
    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(await screen.findByText("Usá al menos 8 caracteres.")).toBeInTheDocument();
    expect(screen.queryByText("Mínimo 8 caracteres.")).not.toBeInTheDocument();
  });

  it("shows the default password hint when there's no error", () => {
    render(<SignupForm />);
    expect(screen.getByText("Mínimo 8 caracteres.")).toBeInTheDocument();
  });
});
