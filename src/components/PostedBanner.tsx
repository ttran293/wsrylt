"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function PostedBannerInner() {
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (searchParams.get("posted") === "1") {
      setVisible(true);
      window.history.replaceState({}, "", "/");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!visible) return;

    const timeoutId = window.setTimeout(() => {
      setVisible(false);
    }, 5000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="ui-banner fixed! bottom-20 left-1/2 z-9999 -translate-x-1/2 px-4 py-2 text-sm shadow-lg">
      your new song is posted!
      <button type="button" onClick={() => setVisible(false)} className="ui-link ml-3">
        [ dismiss ]
      </button>
    </div>
  );
}

export function PostedBanner() {
  return (
    <Suspense fallback={null}>
      <PostedBannerInner />
    </Suspense>
  );
}
