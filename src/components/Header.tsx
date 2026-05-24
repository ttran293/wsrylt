"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { HomeIcon, NewPostIcon } from "@/components/NavIcons";

export function Header() {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();

  function navTabClass(href: string) {
    const active = pathname === href;
    return `ui-nav-tab ${active ? "ui-nav-tab-active" : ""}`;
  }

  return (
    <header className="crt-bg sticky top-0 z-40 border-b border-[var(--border)]">
      <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center gap-x-2 gap-y-3 px-4 py-3 text-sm">
        <nav className="flex items-center gap-2">
          <Link href="/" className={navTabClass("/")}>
            <HomeIcon className="ui-tab-icon" />
            <span>home</span>
          </Link>
          <Link href="/post" className={navTabClass("/post")}>
            <NewPostIcon className="ui-tab-icon" />
            <span>new post</span>
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {loading ? (
            <span className="ui-muted text-sm">loading...</span>
          ) : user ? (
            <>
              <Link href={`/user/${user.userId}`} className="ui-link">
                {user.name}
              </Link>
              <span className="ui-separator">|</span>
              <button type="button" onClick={() => logout()} className="ui-btn">
                [ log out ]
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="ui-btn">
                [ log in ]
              </Link>
              <Link href="/signup" className="ui-btn ui-btn-accent">
                [ sign up ]
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
