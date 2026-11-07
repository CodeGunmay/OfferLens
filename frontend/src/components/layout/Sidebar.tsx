import {
  BarChart3,
  Building2,
  GitMerge,
  Landmark,
  Layers,
  LayoutDashboard,
  ListOrdered,
  Scale,
  Settings as SettingsIcon,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useWorkspace } from "../../context/WorkspaceContext";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: "review";
}

const NAV_SECTIONS: { heading: string; items: NavItem[] }[] = [
  {
    heading: "Workspace",
    items: [
      { to: "/", label: "Overview", icon: LayoutDashboard },
      { to: "/hotels", label: "Hotel Inventory", icon: Building2 },
      { to: "/sightseeing", label: "Sightseeing Inventory", icon: Landmark },
    ],
  },
  {
    heading: "Intelligence",
    items: [
      { to: "/matches", label: "Match Review", icon: GitMerge, badge: "review" },
      { to: "/compare", label: "Offer Comparison", icon: Scale },
      { to: "/ranking", label: "Ranking Intelligence", icon: ListOrdered },
      { to: "/enrichment", label: "Content Enrichment", icon: Layers },
    ],
  },
  {
    heading: "Governance",
    items: [
      { to: "/analytics", label: "Analytics", icon: BarChart3 },
      { to: "/settings", label: "Settings", icon: SettingsIcon },
    ],
  },
];

export function Sidebar() {
  const { reviewLoad } = useWorkspace();

  return (
    <aside className="fixed bottom-0 left-0 top-16 z-20 hidden w-[264px] flex-col border-r border-navy-deep/60 bg-navy-fade lg:flex">
      <nav className="flex-1 overflow-y-auto scroll-thin px-3 py-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.heading} className="mb-5">
            <p className="mb-2 px-3 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-white/35">
              {section.heading}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === "/"}
                      className={({ isActive }) =>
                        [
                          "group relative flex items-center gap-2.5 rounded-lg px-3 py-[9px] text-[13px] transition-all duration-150",
                          isActive
                            ? "bg-white/[0.10] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                            : "text-white/65 hover:bg-white/[0.06] hover:text-white",
                        ].join(" ")
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive ? (
                            <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-teal shadow-[0_0_12px_rgba(22,184,166,0.7)]" />
                          ) : null}
                          <Icon
                            className={`h-[17px] w-[17px] shrink-0 transition-colors ${
                              isActive ? "text-teal-light" : "text-white/40 group-hover:text-white/70"
                            }`}
                            strokeWidth={1.9}
                          />
                          <span className="truncate">{item.label}</span>
                          {item.badge === "review" && reviewLoad > 0 ? (
                            <span className="ml-auto rounded-full bg-teal/25 px-1.5 py-px text-[10px] font-semibold text-teal-light">
                              {reviewLoad}
                            </span>
                          ) : null}
                        </>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        <div className="mx-1 mt-1 rounded-xl border border-white/10 bg-white/[0.05] p-3">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-white/85">
            <Sparkles className="h-3.5 w-3.5 text-gold" />
            VoyageHack 4.0
          </p>
          <p className="mt-1 text-[10.5px] leading-4 text-white/45">
            Concept prototype for multi-supplier offer equivalence.
          </p>
        </div>
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-white/85">
            <ShieldCheck className="h-3.5 w-3.5 text-teal" />
            Synthetic demo dataset
          </div>
          <p className="mt-1.5 text-[10.5px] leading-4 text-white/45">
            3 fictional suppliers · 30 listings. Not TBO inventory, not a TBO product.
          </p>
        </div>
        <p className="mt-2.5 px-1 text-[10px] text-white/30">OfferLens v0.1 · concept prototype</p>
      </div>
    </aside>
  );
}
