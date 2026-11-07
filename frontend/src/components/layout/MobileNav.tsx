import { NavLink } from "react-router-dom";

const LINKS = [
  { to: "/", label: "Overview" },
  { to: "/hotels", label: "Hotels" },
  { to: "/sightseeing", label: "Sightseeing" },
  { to: "/matches", label: "Match review" },
  { to: "/compare", label: "Compare" },
  { to: "/ranking", label: "Ranking" },
  { to: "/enrichment", label: "Content" },
  { to: "/analytics", label: "Analytics" },
  { to: "/settings", label: "Settings" },
];

/** Narrow-viewport navigation. The sidebar is the primary nav on desktop. */
export function MobileNav() {
  return (
    <nav className="sticky top-16 z-20 -mx-5 mb-4 overflow-x-auto scroll-thin border-b border-line bg-white/95 px-4 py-2 backdrop-blur lg:hidden">
      <ul className="flex items-center gap-1.5">
        {LINKS.map((link) => (
          <li key={link.to}>
            <NavLink
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-colors ${
                  isActive ? "bg-navy text-white" : "text-muted hover:bg-[#F1F5F9] hover:text-ink"
                }`
              }
            >
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
