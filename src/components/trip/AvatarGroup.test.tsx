import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AvatarGroup } from "./AvatarGroup";

describe("AvatarGroup", () => {
  it("shows every avatar when under the max, with no overflow badge", () => {
    render(<AvatarGroup people={["Juan", "María", "Sofi"]} max={4} />);

    expect(screen.getByTitle("Juan")).toBeInTheDocument();
    expect(screen.getByTitle("María")).toBeInTheDocument();
    expect(screen.getByTitle("Sofi")).toBeInTheDocument();
    expect(screen.queryByText(/^\+\d/)).not.toBeInTheDocument();
  });

  it("caps at max and shows a +N overflow badge for the rest", () => {
    render(<AvatarGroup people={["Juan", "María", "Sofi", "Nico", "Tomi"]} max={4} />);

    expect(screen.getByTitle("Juan")).toBeInTheDocument();
    expect(screen.getByTitle("Nico")).toBeInTheDocument();
    expect(screen.queryByTitle("Tomi")).not.toBeInTheDocument();
    expect(screen.getByText("+1")).toBeInTheDocument();
  });

  it("keeps a person's own colorIndex instead of recomputing by position", () => {
    render(
      <AvatarGroup
        people={[
          { name: "Juan", colorIndex: 4 },
          { name: "María", colorIndex: 0 },
        ]}
      />,
    );

    expect(screen.getByTitle("Juan").className).toContain("bg-avatar-5");
    expect(screen.getByTitle("María").className).toContain("bg-avatar-1");
  });
});
