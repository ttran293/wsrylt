interface TagListProps {
  tags: string[];
  onTagClick?: (tag: string) => void;
  className?: string;
}

export function TagList({ tags, onTagClick, className = "" }: TagListProps) {
  if (tags.length === 0) return null;

  return (
    <ul className={`flex flex-wrap gap-1.5 ${className}`}>
      {tags.map((tag) => (
        <li key={tag}>
          {onTagClick ? (
            <button
              type="button"
              onClick={() => onTagClick(tag)}
              className="ui-tag ui-tag-link"
            >
              <span className="ui-tag-label">#{tag}</span>
            </button>
          ) : (
            <span className="ui-tag">
              <span className="ui-tag-label">#{tag}</span>
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
