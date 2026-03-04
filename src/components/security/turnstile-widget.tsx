"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

interface TurnstileInstance {
  render: (
    container: HTMLElement | string,
    options: {
      sitekey: string;
      action?: string;
      theme?: "light" | "dark" | "auto";
      size?: "normal" | "compact" | "flexible";
      callback?: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
    }
  ) => string;
  reset: (widgetId?: string) => void;
  remove?: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileInstance;
  }
}

interface TurnstileWidgetProps {
  action: string;
  onTokenChange: (token: string) => void;
  resetSignal?: number;
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";

export function TurnstileWidget({ action, onTokenChange, resetSignal }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenChangeRef = useRef(onTokenChange);

  useEffect(() => {
    onTokenChangeRef.current = onTokenChange;
  }, [onTokenChange]);

  useEffect(() => {
    if (!SITE_KEY) return;
    let active = true;

    const tryRender = () => {
      if (!active || widgetIdRef.current || !containerRef.current || !window.turnstile) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        action,
        theme: "dark",
        size: "flexible",
        callback: (token) => onTokenChangeRef.current(token),
        "expired-callback": () => onTokenChangeRef.current(""),
        "error-callback": () => onTokenChangeRef.current(""),
      });
    };

    tryRender();
    const intervalId = window.setInterval(tryRender, 200);
    const timeoutId = window.setTimeout(() => window.clearInterval(intervalId), 4000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
      if (widgetIdRef.current && window.turnstile?.remove) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
    };
  }, [action]);

  useEffect(() => {
    if (!SITE_KEY || !widgetIdRef.current || !window.turnstile) return;
    onTokenChangeRef.current("");
    window.turnstile.reset(widgetIdRef.current);
  }, [resetSignal]);

  if (!SITE_KEY) return null;

  return (
    <>
      <Script
        id="turnstile-api-script"
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
      />
      <div ref={containerRef} className="min-h-[70px]" />
    </>
  );
}
