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
      <path d="M7 2h2v5h5v2H9v5H7V9H2V7h5V2Z" />
    </svg>
  );
}

export function LogInIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden
    >
      <path d="M2 2h7v2H4v8h5v2H2V2Zm8.2 3.2L13 8l-2.8 2.8-1.4-1.4.6-.6H6v-2h3.4l-.6-.6 1.4-1.4Z" />
    </svg>
  );
}

export function SignUpIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden
    >
      <path d="M6.5 8A3 3 0 1 0 6.5 2a3 3 0 0 0 0 6Zm0-1.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3ZM1 14c.4-2.8 2.4-4.5 5.5-4.5.9 0 1.7.2 2.4.5l-.7 1.4c-.5-.2-1.1-.4-1.7-.4-1.8 0-3 .7-3.6 2h5.6v1.5H1V14Zm11-6V5.5h1.5V8H16v1.5h-2.5V12H12V9.5H9.5V8H12Z" />
    </svg>
  );
}

export function PostsTabIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden
    >
      <path d="M2 2h5v5H2V2Zm7 0h5v5H9V2ZM2 9h5v5H2V9Zm7 0h5v5H9V9Z" />
    </svg>
  );
}

export function LikesTabIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden
    >
      <path d="M8 14s5-3.2 5-7a3 3 0 0 0-5-2.2A3 3 0 0 0 3 7c0 3.8 5 7 5 7Z" />
    </svg>
  );
}

export function CommentsTabIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden
    >
      <path d="M2 2h12v8H5l-3 3V2Zm1 1v8.2L5.8 10H13V3H3Z" />
    </svg>
  );
}

export function BellIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden
    >
      <path d="M8 15a2 2 0 0 0 1.9-1.4H6.1A2 2 0 0 0 8 15ZM3 12.5h10l-1.4-2V7a3.6 3.6 0 0 0-2.8-3.5V2a.8.8 0 0 0-1.6 0v1.5A3.6 3.6 0 0 0 4.4 7v3.5L3 12.5Zm2.6-1V7A2.4 2.4 0 0 1 8 4.6 2.4 2.4 0 0 1 10.4 7v4.5H5.6Z" />
    </svg>
  );
}
