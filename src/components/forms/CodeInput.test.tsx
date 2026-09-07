import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CodeInput } from "./CodeInput";

function boxes() {
  return screen.getAllByRole("textbox") as HTMLInputElement[];
}

function hiddenField() {
  return document.querySelector('input[name="code"]') as HTMLInputElement;
}

describe("CodeInput", () => {
  it("auto-advances focus after typing a digit", () => {
    render(<CodeInput name="code" value="" onChange={vi.fn()} />);
    const inputs = boxes();

    fireEvent.change(inputs[0], { target: { value: "1" } });

    expect(document.activeElement).toBe(inputs[1]);
  });

  it("ignores a non-digit keystroke", () => {
    const onChange = vi.fn();
    render(<CodeInput name="code" value="" onChange={onChange} />);

    fireEvent.change(boxes()[0], { target: { value: "a" } });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("clears the focused box on backspace, or steps back and clears the previous one if already empty", () => {
    const onChange = vi.fn();
    const { rerender } = render(<CodeInput name="code" value="12" onChange={onChange} />);
    let inputs = boxes();

    // Clearing box 1 in a 6-box row pads the rest with spaces (join() would
    // otherwise collapse the gap) — box 0's "1" is untouched.
    fireEvent.keyDown(inputs[1], { key: "Backspace" });
    expect(onChange).toHaveBeenLastCalledWith("1     ");

    onChange.mockClear();
    rerender(<CodeInput name="code" value="1" onChange={onChange} />);
    inputs = boxes();
    fireEvent.keyDown(inputs[1], { key: "Backspace" });
    expect(onChange).toHaveBeenLastCalledWith("      ");
    expect(document.activeElement).toBe(inputs[0]);
  });

  it("moves focus with arrow keys without changing the value", () => {
    const onChange = vi.fn();
    render(<CodeInput name="code" value="123" onChange={onChange} />);
    const inputs = boxes();

    fireEvent.keyDown(inputs[2], { key: "ArrowLeft" });
    expect(document.activeElement).toBe(inputs[1]);

    fireEvent.keyDown(inputs[1], { key: "ArrowRight" });
    expect(document.activeElement).toBe(inputs[2]);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("splits a pasted 6-digit string across all boxes", () => {
    const onChange = vi.fn();
    render(<CodeInput name="code" value="" onChange={onChange} />);

    fireEvent.paste(boxes()[0], { clipboardData: { getData: () => "123456" } });

    expect(onChange).toHaveBeenCalledWith("123456");
  });

  it("truncates a paste longer than the box count", () => {
    const onChange = vi.fn();
    render(<CodeInput name="code" value="" onChange={onChange} />);

    fireEvent.paste(boxes()[0], { clipboardData: { getData: () => "1234567890" } });

    expect(onChange).toHaveBeenCalledWith("123456");
  });

  it("applies the alert ring to every box on error, and disables every box", () => {
    render(<CodeInput name="code" value="123456" onChange={vi.fn()} error disabled />);
    for (const input of boxes()) {
      expect(input.className).toContain("var(--alert)");
      expect(input).toBeDisabled();
    }
  });

  it("keeps the hidden field mirroring the combined value", () => {
    render(<CodeInput name="code" value="12" onChange={vi.fn()} />);
    expect(hiddenField().value).toEqual("12");
  });
});
