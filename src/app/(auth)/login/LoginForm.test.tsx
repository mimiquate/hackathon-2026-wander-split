import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LoginForm } from "./LoginForm";

const { loginAction } = vi.hoisted(() => ({ loginAction: vi.fn() }));
vi.mock("./actions", () => ({ loginAction }));

function fillAndSubmit(email: string, password: string) {
  fireEvent.change(screen.getByLabelText("Correo"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: /Entrar/ }));
}

describe("LoginForm", () => {
  it("shows the busy label and disables the submit button while pending", async () => {
    // React dispatches actions one at a time per action reference, so this
    // has to eventually resolve — otherwise it would leave the shared
    // `loginAction` mock permanently "in flight" for every later test.
    let resolveAction!: (value: object) => void;
    loginAction.mockReturnValue(new Promise((resolve) => (resolveAction = resolve)));
    render(<LoginForm justCreated={false} />);

    fillAndSubmit("juan@correo.com", "hunter2");

    const button = await screen.findByRole("button", { name: "Entrando…" });
    expect(button).toBeDisabled();

    resolveAction({});
    await screen.findByRole("button", { name: "Entrar" });
  });

  it("renders the wrong-password error on the password field with the real remaining count", async () => {
    loginAction.mockResolvedValue({
      fieldErrors: { password: "Contraseña incorrecta. Te quedan 3 intentos." },
    });
    render(<LoginForm justCreated={false} />);

    fillAndSubmit("juan@correo.com", "wrong");

    expect(
      await screen.findByText("Contraseña incorrecta. Te quedan 3 intentos."),
    ).toBeInTheDocument();
  });

  it("shows the rate-limit banner and disables the whole form", async () => {
    loginAction.mockResolvedValue({
      formError: "Demasiados intentos. Probá de nuevo en 5 minutos.",
      rateLimited: true,
    });
    render(<LoginForm justCreated={false} />);

    fillAndSubmit("juan@correo.com", "wrong");

    expect(
      await screen.findByText("Demasiados intentos. Probá de nuevo en 5 minutos."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Correo")).toBeDisabled();
    expect(screen.getByLabelText("Contraseña")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Entrar" })).toBeDisabled();
  });

  it("shows the post-signup confirmation line when justCreated is true", () => {
    render(<LoginForm justCreated={true} />);
    expect(screen.getByText("Cuenta creada. Iniciá sesión para continuar.")).toBeInTheDocument();
  });

  it("carries the next value as a hidden field, so loginAction can redirect back after success", () => {
    const { container } = render(<LoginForm justCreated={false} next="/i/abc123" />);
    expect(container.querySelector('input[name="next"]')).toHaveValue("/i/abc123");
  });

  it("threads next through to the signup link", () => {
    render(<LoginForm justCreated={false} next="/i/abc123" />);
    expect(screen.getByRole("link", { name: "Creá tu cuenta" })).toHaveAttribute(
      "href",
      "/signup?next=%2Fi%2Fabc123",
    );
  });
});
