"use client";

import { useEffect, useState } from "react";

interface Props {
  width?: number;
  height?: number;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function ThemeLogo({ width = 36, height = 36, alt = "HAIG", className, style }: Props) {
  const [src, setSrc] = useState("/logo-mark.svg");

  useEffect(() => {
    function update() {
      const theme = document.documentElement.dataset.theme;
      setSrc(theme === "light" ? "/logo-mark-dark.svg" : "/logo-mark.svg");
    }

    update();

    // Watch for theme changes via MutationObserver on data-theme attribute
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  /* eslint-disable @next/next/no-img-element */
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={{ display: "block", ...style }}
    />
  );
}
