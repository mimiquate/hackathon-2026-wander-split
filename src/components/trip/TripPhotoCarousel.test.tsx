import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TripPhotoCarousel } from "./TripPhotoCarousel";

describe("TripPhotoCarousel", () => {
  it("shows a single static placeholder with no controls when there are no cities", () => {
    render(<TripPhotoCarousel cities={[]} fallbackLabel="Viaje a ningún lado" />);

    expect(screen.getByText("Viaje a ningún lado")).toBeInTheDocument();
    expect(screen.queryByLabelText("Foto anterior")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Foto siguiente")).not.toBeInTheDocument();
  });

  it("shows a single static placeholder with no controls for exactly one city", () => {
    render(<TripPhotoCarousel cities={["Sevilla"]} fallbackLabel="Viaje" />);

    expect(screen.getByText("Sevilla")).toBeInTheDocument();
    expect(screen.queryByLabelText("Foto anterior")).not.toBeInTheDocument();
  });

  it("shows arrows and dots for two or more cities, defaulting to the first", () => {
    render(<TripPhotoCarousel cities={["Sevilla", "Madrid", "Barcelona"]} fallbackLabel="Viaje" />);

    expect(screen.getByText("Sevilla")).toBeInTheDocument();
    expect(screen.getByLabelText("Foto anterior")).toBeInTheDocument();
    expect(screen.getByLabelText("Foto siguiente")).toBeInTheDocument();
    expect(screen.getAllByLabelText(/^Ir a la foto/)).toHaveLength(3);
  });

  it("advances to the next slide on arrow click, wrapping past the end", () => {
    render(<TripPhotoCarousel cities={["Sevilla", "Madrid"]} fallbackLabel="Viaje" />);

    fireEvent.click(screen.getByLabelText("Foto siguiente"));
    expect(screen.getByText("Madrid")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Foto siguiente"));
    expect(screen.getByText("Sevilla")).toBeInTheDocument();
  });

  it("goes back on the previous arrow, wrapping before the start", () => {
    render(<TripPhotoCarousel cities={["Sevilla", "Madrid"]} fallbackLabel="Viaje" />);

    fireEvent.click(screen.getByLabelText("Foto anterior"));
    expect(screen.getByText("Madrid")).toBeInTheDocument();
  });

  it("jumps directly to a slide when its dot is clicked", () => {
    render(<TripPhotoCarousel cities={["Sevilla", "Madrid", "Barcelona"]} fallbackLabel="Viaje" />);

    fireEvent.click(screen.getByLabelText("Ir a la foto 3"));
    expect(screen.getByText("Barcelona")).toBeInTheDocument();
  });
});
