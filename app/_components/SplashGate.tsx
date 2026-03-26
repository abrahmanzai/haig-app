"use client";

import { useEffect, useState } from "react";
import SplashScreen from "./SplashScreen";

export default function SplashGate() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem("haig_splash_seen")) {
      setShow(true);
    }
  }, []);

  function handleDone() {
    sessionStorage.setItem("haig_splash_seen", "1");
    setShow(false);
  }

  if (!show) return null;
  return <SplashScreen onDone={handleDone} />;
}
