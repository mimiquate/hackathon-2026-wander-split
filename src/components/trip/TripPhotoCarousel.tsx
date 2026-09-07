"use client";

import { useState } from "react";
import { Icon } from "@/components/core/Icon";
import { defaultColorIndexFor } from "@/lib/avatar-colors";
import { avatarRampClass } from "./Avatar";

export interface TripPhotoCarouselProps {
  /** City names along the route, in order. Empty until #8 gives the trip stops. */
  cities: string[];
  /** Shown on the single placeholder tile when there are no cities yet. */
  fallbackLabel: string;
}

function Slide({ label }: { label: string }) {
  return (
    <div
      className={[
        "flex h-full w-full flex-col items-center justify-center gap-[var(--space-2)]",
        avatarRampClass(defaultColorIndexFor(label)),
      ].join(" ")}
    >
      <Icon name="map-pin" size={28} className="text-text-on-accent opacity-80" />
      <span className="px-[var(--space-4)] text-center font-display text-[length:var(--text-sm)] font-bold text-text-on-accent">
        {label}
      </span>
    </div>
  );
}

/** Placeholder photo strip atop a trip card — one generic tile per city,
 * with swipe/arrow navigation and dot indicators once there's more than one. */
export function TripPhotoCarousel({ cities, fallbackLabel }: TripPhotoCarouselProps) {
  const slides = cities.length > 0 ? cities : [fallbackLabel];
  const [index, setIndex] = useState(0);
  const showControls = slides.length > 1;

  function goTo(next: number) {
    setIndex(((next % slides.length) + slides.length) % slides.length);
  }

  return (
    <div className="relative h-40 w-full overflow-hidden">
      <Slide label={slides[index]} />
      {showControls ? (
        <>
          <button
            type="button"
            aria-label="Foto anterior"
            onClick={(event) => {
              event.preventDefault();
              goTo(index - 1);
            }}
            className="absolute left-[var(--space-3)] top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-surface/80 text-text shadow-card"
          >
            <Icon name="chevron-left" size={16} />
          </button>
          <button
            type="button"
            aria-label="Foto siguiente"
            onClick={(event) => {
              event.preventDefault();
              goTo(index + 1);
            }}
            className="absolute right-[var(--space-3)] top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-surface/80 text-text shadow-card"
          >
            <Icon name="chevron-right" size={16} />
          </button>
          <div className="absolute bottom-[var(--space-3)] left-1/2 flex -translate-x-1/2 gap-[var(--space-2)]">
            {slides.map((slide, i) => (
              <button
                key={slide + i}
                type="button"
                aria-label={`Ir a la foto ${i + 1}`}
                aria-current={i === index}
                onClick={(event) => {
                  event.preventDefault();
                  goTo(i);
                }}
                className={[
                  "h-2 w-2 rounded-full",
                  i === index ? "bg-surface" : "bg-surface/50",
                ].join(" ")}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
