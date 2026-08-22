"use client";

import Link from "next/link";
import { useUser, UserButton } from "@clerk/nextjs";
import { ImageIcon, GaugeIcon, CameraIcon, ShareIcon } from "@/components/ui";

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
        <NavLink href="/capture" icon={CameraIcon}>
          Capture
        </NavLink>
        <NavLink href="/gallery" icon={ImageIcon}>
          Gallery
        </NavLink>
        <NavLink href="/wall" icon={ShareIcon}>
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
