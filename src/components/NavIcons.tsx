interface IconProps {
  className?: string;
}

export function HomeIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden
    >
      <path d="M8 1 1 7v8h5v-5h4v5h5V7L8 1Zm0 2.2 4 3.5v5.3h-2V9H6v3H4V6.7l4-3.5Z" />
    </svg>
  );
}

export function NewPostIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden
    >
      <path d="M3 2h10v12H3V2Zm1 1v10h8V3H4Zm3 2h2v3h3v2H9v3H7V8H4V6h3V5Z" />
    </svg>
  );
}
