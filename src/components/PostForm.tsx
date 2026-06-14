"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { MediaPlayer } from "@/components/MediaPlayer";
import { isBandcampPageUrl, parseMediaUrl } from "@/lib/media";

interface SearchResult {
  videoId: string;
  title: string;
  thumbnail: string;
}

export function PostForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [searching, setSearching] = useState(false);
  const [bandcampPreview, setBandcampPreview] = useState<{
    sourceUrl: string;
    embedUrl: string;
  } | null>(null);

  const previewUrl = selectedVideoId
    ? `https://www.youtube.com/watch?v=${selectedVideoId}`
    : url.trim() || null;

  const previewPlayerUrl = useMemo(() => {
    if (!previewUrl) return null;

    if (parseMediaUrl(previewUrl)) return previewUrl;
    if (bandcampPreview?.sourceUrl === previewUrl) {
      return bandcampPreview.embedUrl;
    }

    return null;
  }, [previewUrl, bandcampPreview]);

  useEffect(() => {
    if (!previewUrl || parseMediaUrl(previewUrl) || !isBandcampPageUrl(previewUrl)) {
      return;
    }

    if (bandcampPreview?.sourceUrl === previewUrl) {
      return;
    }

    let cancelled = false;

    fetch(`/api/media/resolve?url=${encodeURIComponent(previewUrl)}`)
      .then(async (response) => {
        const data = await response.json();
        if (cancelled || !response.ok || !data.embedUrl) return;

        setBandcampPreview({
          sourceUrl: previewUrl,
          embedUrl: data.embedUrl,
        });
      })
      .catch(() => {
        if (!cancelled) setBandcampPreview(null);
      });

    return () => {
      cancelled = true;
    };
  }, [previewUrl, bandcampPreview]);

  async function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setError("");
    try {
      const response = await fetch(
        `/api/youtube/search?q=${encodeURIComponent(searchQuery.trim())}`,
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Search failed.");
        setSearchResults([]);
        return;
      }
      setSearchResults(data);
    } catch {
      setError("Search failed.");
    } finally {
      setSearching(false);
    }
  }

  function selectVideo(videoId: string) {
    setSelectedVideoId(videoId);
    setUrl(`https://www.youtube.com/watch?v=${videoId}`);
    setSearchResults([]);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    const resolvedUrl =
      url.trim() ||
      (selectedVideoId
        ? `https://www.youtube.com/watch?v=${selectedVideoId}`
        : "");

    const media = parseMediaUrl(resolvedUrl);
    if (!media && !isBandcampPageUrl(resolvedUrl)) {
      setError(
        "Enter a valid YouTube, Spotify, SoundCloud, or Bandcamp link, or search YouTube for a song.",
      );
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          posturl: resolvedUrl,
          caption,
          tags,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Could not create post.");
        return;
      }

      router.push("/?posted=1");
      router.refresh();
    } catch {
      setError("Could not create post.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-2 lg:items-stretch"
    >
      <div className="ui-panel h-full p-6">
        <h1 className="ui-title text-2xl font-medium">share a song</h1>
        <p className="ui-muted mt-2 text-sm">
          paste a youtube, spotify, soundcloud, or bandcamp link, or search
          youtube by keyword.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="url" className="block text-sm">
              music url
            </label>
            <input
              id="url"
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setSelectedVideoId(null);
              }}
              placeholder="soundcloud.com/... bandcamp.com/track/... spotify.com/track/..."
              className="ui-input mt-1"
            />
          </div>

          <div>
            <label htmlFor="search" className="block text-sm">
              or search youtube
            </label>
            <div className="mt-1 flex gap-2">
              <input
                id="search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="song or artist name"
                className="ui-input flex-1"
              />
              <button
                type="button"
                disabled={searching}
                onClick={handleSearch}
                className="ui-btn ui-btn-accent shrink-0"
              >
                {searching ? "[ ... ]" : "[ search ]"}
              </button>
            </div>
          </div>

          {searchResults.length > 0 && (
            <ul
              className="max-h-64 space-y-2 overflow-y-auto border border-border p-2"
              data-lenis-prevent
            >
              {searchResults.map((result) => (
                <li key={result.videoId}>
                  <button
                    type="button"
                    onClick={() => selectVideo(result.videoId)}
                    className="flex w-full items-center gap-3 p-2 text-left hover:bg-(--surface-hover)"
                  >
                    {result.thumbnail && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={result.thumbnail}
                        alt=""
                        className="h-12 w-20 object-cover"
                      />
                    )}
                    <span className="text-sm">{result.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div>
            <label htmlFor="caption" className="block text-sm">
              caption (optional)
            </label>
            <textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              maxLength={500}
              className="ui-input mt-1"
            />
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm">
              tags (optional)
            </label>
            <input
              id="tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="ui-input mt-1"
            />
          </div>

          {error && (
            <p className="border border-red-400/50 bg-red-950/30 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="ui-btn ui-btn-accent w-full"
          >
            {busy ? "[ posting... ]" : "[ post song ]"}
          </button>
        </div>
      </div>

      <aside className="ui-panel w-full p-6 lg:sticky lg:top-24 lg:h-full">
        <h2 className="ui-muted mb-3 text-sm">preview</h2>
        {previewPlayerUrl ? (
          <MediaPlayer url={previewPlayerUrl} />
        ) : (
          <div className="flex min-h-48 items-center justify-center border border-dashed border-border p-6 text-center">
            <p className="ui-muted text-sm">
              paste a supported music link or select a youtube result to preview it
              here.
            </p>
          </div>
        )}
      </aside>
    </form>
  );
}
