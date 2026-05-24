"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function TrackVisit() {
  const pathname = usePathname();
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    if (pathname.startsWith("/admin")) return;
    tracked.current = true;
    fetch("/api/track/visit", { method: "POST" }).catch(() => {});
  }, [pathname]);

  return null;
}
