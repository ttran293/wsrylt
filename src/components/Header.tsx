"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { NotificationsMenu } from "@/components/NotificationsMenu";
import { HomeIcon, LogInIcon, NewPostIcon, SignUpIcon } from "@/components/NavIcons";

export function Header() {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();

  function navTabClass(href: string) {
    const active = pathname === href;
    return `ui-nav-tab ${active ? "ui-nav-tab-active" : ""}`;
  }

  return (
    <header className="site-header crt-bg sticky top-0 border-b border-border">
      <div className="flex w-full flex-wrap items-center gap-x-2 gap-y-3 px-4 py-3 text-sm">
        <nav className="flex items-center gap-2">
          <Link href="/" className={navTabClass("/")}>
            <HomeIcon className="ui-tab-icon" />
            <span>home</span>
          </Link>
          <Link href="/post" className={navTabClass("/post")} aria-label="new post">
            <NewPostIcon className="ui-tab-icon" />
            <span className="header-mobile-label">new post</span>
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
              <NotificationsMenu />
              <span className="ui-separator">|</span>
              <button type="button" onClick={() => logout()} className="ui-btn">
                [ log out ]
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="ui-btn header-auth-link" aria-label="log in">
                <LogInIcon className="ui-tab-icon header-auth-icon" />
                <span className="header-auth-label">[ log in ]</span>
              </Link>
              <Link
                href="/signup"
                className="ui-btn ui-btn-accent header-auth-link"
                aria-label="sign up"
              >
                <SignUpIcon className="ui-tab-icon header-auth-icon" />
                <span className="header-auth-label signup-label-bop">[ sign up ]</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
