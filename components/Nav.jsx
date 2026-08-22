"use client";

import Link from "next/link";
import { useUser, UserButton } from "@clerk/nextjs";
import { ImageIcon, GaugeIcon } from "@/components/ui";

// components/ui/ is owned by nobody in this feature, so the two icons the new
// links need live here instead — the same inline 20x20 stroke shape the rest of
// the set uses, and the same pattern app/dashboard/page.jsx already follows.
const GridIcon = (props) => (
  <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5" {...props}>
    <rect x="3" y="3" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <rect x="11" y="3" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <rect x="3" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <rect x="11" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const WallIcon = (props) => (
  <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5" {...props}>
    <rect x="2.5" y="4" width="15" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M2.5 8h15M2.5 12h15M8 4v4M12.5 8v4M8 12v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const NavLink = ({ href, icon: Icon, children }) => (
  <Link
    href={href}
    className="flex items-center gap-2 h-10 px-4 rounded-md body-sm text-ink-subtle transition-colors hover:bg-surface-3 hover:text-ink"
  >
    <Icon className="w-[18px] h-[18px]" />
    {children}
  </Link>
);

export const Nav = () => {
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === "admin";

  return (
    <div className="flex items-center justify-between">
      <nav className="flex items-center gap-1 bg-surface-1 border border-hairline rounded-lg p-1">
        <NavLink href="/capture" icon={ImageIcon}>
          Capture
        </NavLink>
        <NavLink href="/gallery" icon={GridIcon}>
          Gallery
        </NavLink>
        <NavLink href="/wall" icon={WallIcon}>
          Wall
        </NavLink>
        {isAdmin && (
          <NavLink href="/dashboard" icon={GaugeIcon}>
            Dashboard
          </NavLink>
        )}
      </nav>
      <UserButton />
    </div>
  );
};
