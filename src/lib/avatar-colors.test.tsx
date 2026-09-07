import { describe, expect, it } from "vitest";
import { Avatar } from "@/components/trip/Avatar";
import { render } from "@testing-library/react";
import { AVATAR_COLOR_COUNT, defaultColorIndexFor, isAvatarColorIndex } from "./avatar-colors";

describe("isAvatarColorIndex", () => {
  it("accepts every in-range integer", () => {
    for (let i = 0; i < AVATAR_COLOR_COUNT; i++) {
      expect(isAvatarColorIndex(i)).toBe(true);
    }
  });

  it.each([-1, AVATAR_COLOR_COUNT, AVATAR_COLOR_COUNT + 1, 1.5, NaN])(
    "rejects %j",
    (value) => {
      expect(isAvatarColorIndex(value)).toBe(false);
    },
  );
});

describe("defaultColorIndexFor", () => {
  it("is deterministic for the same seed", () => {
    expect(defaultColorIndexFor("user-123")).toEqual(defaultColorIndexFor("user-123"));
  });

  it("always returns an in-range index", () => {
    for (const seed of ["a", "user-1", "user-2", "", "cme1234567890"]) {
      expect(isAvatarColorIndex(defaultColorIndexFor(seed))).toBe(true);
    }
  });
});

// Drift guard: Avatar.tsx's own RAMP_CLASSES array is the component's source
// of truth, but AVATAR_COLOR_COUNT must stay in sync with it since the data
// layer uses AVATAR_COLOR_COUNT to validate a chosen color index.
describe("AVATAR_COLOR_COUNT matches Avatar's ramp", () => {
  it("renders exactly AVATAR_COLOR_COUNT distinct classes across the wrap", () => {
    const classes = new Set<string>();
    for (let i = 0; i < AVATAR_COLOR_COUNT; i++) {
      const { container } = render(<Avatar name="Test" colorIndex={i} />);
      const span = container.querySelector("span");
      const ramp = Array.from(span?.classList ?? []).find((c) => c.startsWith("bg-avatar-"));
      expect(ramp).toBeDefined();
      classes.add(ramp as string);
    }
    expect(classes.size).toEqual(AVATAR_COLOR_COUNT);
  });

  it("wraps index AVATAR_COLOR_COUNT to the same class as 0", () => {
    const renderRamp = (colorIndex: number) => {
      const { container } = render(<Avatar name="Test" colorIndex={colorIndex} />);
      const span = container.querySelector("span");
      return Array.from(span?.classList ?? []).find((c) => c.startsWith("bg-avatar-"));
    };
    expect(renderRamp(AVATAR_COLOR_COUNT)).toEqual(renderRamp(0));
  });
});
