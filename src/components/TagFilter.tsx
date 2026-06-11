"use client";

import { useMemo, useState } from "react";
import type { TagCount } from "@/types";

const DEFAULT_VISIBLE_TAGS = 16;

interface TagFilterProps {
  tags: TagCount[];
  activeTag: string | null;
  onSelect: (tag: string | null) => void;
  maxVisible?: number;
}

function getVisibleTags(
  tags: TagCount[],
  maxVisible: number,
  activeTag: string | null,
  expanded: boolean,
) {
  if (expanded || tags.length <= maxVisible) {
    return tags;
  }

  const visible = tags.slice(0, maxVisible);
  if (!activeTag || visible.some(({ tag }) => tag === activeTag)) {
    return visible;
  }

  const activeEntry = tags.find(({ tag }) => tag === activeTag);
  if (!activeEntry) {
    return visible;
  }

  return [...visible.slice(0, maxVisible - 1), activeEntry];
}

export function TagFilter({
  tags,
  activeTag,
  onSelect,
  maxVisible = DEFAULT_VISIBLE_TAGS,
}: TagFilterProps) {
  const [expanded, setExpanded] = useState(false);

  const visibleTags = useMemo(
    () => getVisibleTags(tags, maxVisible, activeTag, expanded),
    [tags, maxVisible, activeTag, expanded],
  );

  const canExpand = tags.length > maxVisible;
  const hiddenCount = tags.length - maxVisible;

  if (tags.length === 0) return null;

  return (
    <div className="mb-3">
      <p className="ui-muted mb-2 text-xs">filter by tag</p>

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={`ui-tag ${activeTag === null ? "ui-tag-active" : "ui-tag-link"}`}
        >
          all
        </button>
        {visibleTags.map(({ tag, count }, index) => (
          <button
            key={tag}
            type="button"
            onClick={() => onSelect(tag)}
            className={`ui-tag ${activeTag === tag ? "ui-tag-active" : "ui-tag-link"} ${
              index === 0 ? "ui-tag-bop" : ""
            }`}
          >
            <span className="ui-tag-label">#{tag}</span>
            <span className="ui-tag-count">{count}</span>
          </button>
        ))}
        {canExpand && (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="ui-btn shrink-0 text-xs"
          >
            {expanded ? "[ show less ]" : `[ +${hiddenCount} more ]`}
          </button>
        )}
      </div>
    </div>
  );
}
