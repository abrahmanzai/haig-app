"use client";

import { useEffect, useState } from "react";
import SplashScreen from "./SplashScreen";

export default function SplashGate() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem("haig_splash_seen")) {
      // Signal to CSS that the splash is active — hides hero content + watermark
      document.documentElement.dataset.splash = "1";
      setShow(true);
    }
  }, []);

  function handleDone() {
    sessionStorage.setItem("haig_splash_seen", "1");
    // Removing the attribute triggers CSS transitions on hero content + watermark
    delete document.documentElement.dataset.splash;
    setShow(false);
  }

  if (!show) return null;
  return <SplashScreen onDone={handleDone} />;
}
