"use client";

import { useEffect } from "react";

/**
 * Purely behavioral client component.
 * Attaches an IntersectionObserver to all .reveal-up elements on the page and
 * toggles the .is-visible class when they enter the viewport.
 * The actual animation is defined in globals.css (.reveal-up / .is-visible).
 */
export default function ScrollReveal() {
  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>(".reveal-up");
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target); // fire once
          }
        });
      },
      { threshold: 0.12 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return null;
}
