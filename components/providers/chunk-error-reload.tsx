"use client";

import { useEffect } from "react";

const RELOAD_GUARD_KEY = "hostelhub:chunk-reload";

function isChunkLoadError(message: unknown): message is string {
  return (
    typeof message === "string" &&
    /ChunkLoadError|Loading chunk [\d]+ failed|Failed to fetch dynamically imported module/i.test(message)
  );
}

// A tab left open across a dev-server restart (or a new prod deploy) still
// holds references to JS chunks that no longer exist on the server. The
// next client-side navigation then hangs silently — whatever was on screen
// stays there (often a bare "Loading..." fallback) until the user notices
// and hard-reloads by hand. This detects that failure and reloads once
// automatically, guarded by sessionStorage so a genuinely broken bundle
// can't reload-loop forever.
export function ChunkErrorReload() {
  useEffect(() => {
    // This render succeeded, so any earlier auto-reload worked — clear the
    // guard after a bit so a *later* stale-chunk error can trigger again.
    const clearGuard = window.setTimeout(() => sessionStorage.removeItem(RELOAD_GUARD_KEY), 5000);

    const reloadOnce = () => {
      if (sessionStorage.getItem(RELOAD_GUARD_KEY)) return;
      sessionStorage.setItem(RELOAD_GUARD_KEY, "1");
      window.location.reload();
    };

    const onError = (event: ErrorEvent) => {
      if (isChunkLoadError(event.message)) reloadOnce();
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message = reason instanceof Error ? reason.message : String(reason);
      if (isChunkLoadError(message)) reloadOnce();
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.clearTimeout(clearGuard);
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
