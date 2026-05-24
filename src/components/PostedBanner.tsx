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

  if (!visible) return null;

  return (
    <div className="ui-banner mb-6 px-4 py-3 text-sm">
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
