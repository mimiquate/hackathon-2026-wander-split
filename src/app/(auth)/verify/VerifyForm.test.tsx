import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { VerifyForm } from "./VerifyForm";

const { verifyAction, resendAction } = vi.hoisted(() => ({
  verifyAction: vi.fn(),
  resendAction: vi.fn(),
}));
vi.mock("./actions", () => ({ verifyAction, resendAction }));

function typeCode(digits: string) {
  const boxes = screen.getAllByRole("textbox");
  digits.split("").forEach((digit, index) => {
    fireEvent.change(boxes[index], { target: { value: digit } });
  });
}

describe("VerifyForm", () => {
  beforeEach(() => {
    resendAction.mockResolvedValue({});
  });

  it("shows the busy label and disables the submit button while pending", async () => {
    let resolveAction!: (value: object) => void;
    verifyAction.mockReturnValue(new Promise((resolve) => (resolveAction = resolve)));
    render(<VerifyForm email="juan@correo.com" initialCooldownSeconds={0} />);

    typeCode("123456");
    fireEvent.click(screen.getByRole("button", { name: /Verificar/ }));

    const button = await screen.findByRole("button", { name: "Verificando…" });
    expect(button).toBeDisabled();

    resolveAction({});
    await screen.findByRole("button", { name: "Verificar" });
  });

  it("renders the wrong-code error without clearing the typed digits", async () => {
    verifyAction.mockResolvedValue({ formError: "Ese código no es. Fijate que no haya vencido." });
    render(<VerifyForm email="juan@correo.com" initialCooldownSeconds={0} />);

    typeCode("123456");
    fireEvent.click(screen.getByRole("button", { name: /Verificar/ }));

    expect(
      await screen.findByText("Ese código no es. Fijate que no haya vencido."),
    ).toBeInTheDocument();

    const boxes = screen.getAllByRole("textbox") as HTMLInputElement[];
    expect(boxes.map((box) => box.value).join("")).toEqual("123456");
  });

  it("counts down and disables resend until it reaches 0, then shows the resend button", () => {
    vi.useFakeTimers();
    try {
      render(<VerifyForm email="juan@correo.com" initialCooldownSeconds={2} />);

      expect(screen.getByText("Reenviar en 0:02")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Reenviar código/ })).not.toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText("Reenviar en 0:01")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByRole("button", { name: "Reenviar código" })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("resets the countdown and clears the typed digits after a successful resend", async () => {
    resendAction.mockResolvedValue({ resent: true, cooldownSeconds: 60 });
    render(<VerifyForm email="juan@correo.com" initialCooldownSeconds={0} />);

    typeCode("123456");
    fireEvent.click(screen.getByRole("button", { name: "Reenviar código" }));

    expect(await screen.findByText("Reenviar en 0:60")).toBeInTheDocument();
    const boxes = screen.getAllByRole("textbox") as HTMLInputElement[];
    expect(boxes.map((box) => box.value).join("")).toEqual("");
  });

  it("links 'Cambiar el correo' back to /signup", () => {
    render(<VerifyForm email="juan@correo.com" initialCooldownSeconds={0} />);
    expect(screen.getByRole("link", { name: "Cambiar el correo" })).toHaveAttribute(
      "href",
      "/signup",
    );
  });
});
