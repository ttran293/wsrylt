"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { YouTubePlayer } from "@/components/YouTubePlayer";
import { parseYouTubeUrl, toEmbedUrl } from "@/lib/youtube-utils";

interface SearchResult {
  videoId: string;
  title: string;
  thumbnail: string;
}

export function PostForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [searching, setSearching] = useState(false);

  const previewUrl = selectedVideoId
    ? toEmbedUrl(selectedVideoId)
    : parseYouTubeUrl(url)
      ? toEmbedUrl(parseYouTubeUrl(url)!)
      : null;

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

    const videoId = selectedVideoId ?? parseYouTubeUrl(url);
    if (!videoId) {
      setError("Enter a valid YouTube URL or search for a song.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          posturl: url || `https://www.youtube.com/watch?v=${videoId}`,
          caption,
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
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
      <div className="ui-panel p-6">
        <h1 className="ui-title text-2xl font-medium">share a song</h1>
        <p className="ui-muted mt-2 text-sm">
          paste a youtube link or search by keyword.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="url" className="block text-sm">
              youtube url
            </label>
            <input
              id="url"
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setSelectedVideoId(null);
              }}
              placeholder="https://www.youtube.com/watch?v=..."
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
            <ul className="max-h-64 space-y-2 overflow-y-auto border border-[var(--border)] p-2" data-lenis-prevent>
              {searchResults.map((result) => (
                <li key={result.videoId}>
                  <button
                    type="button"
                    onClick={() => selectVideo(result.videoId)}
                    className="flex w-full items-center gap-3 p-2 text-left hover:bg-[var(--surface-hover)]"
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
              placeholder="why do you love this song?"
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

      {previewUrl && (
        <div className="ui-panel p-4">
          <h2 className="ui-muted mb-3 text-sm">preview</h2>
          <YouTubePlayer url={previewUrl} />
        </div>
      )}
    </form>
  );
}
