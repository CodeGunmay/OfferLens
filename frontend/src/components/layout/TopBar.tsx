import { Bell, ChevronDown, Command, Search, UserRound, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useWorkspace } from "../../context/WorkspaceContext";
import { useDebounced } from "../../hooks/useDebounced";
import { api } from "../../services/api";
import type { ActivityEvent, SearchResult } from "../../types";
import { relativeTime } from "../../utils/format";
import { ApiStatus } from "./ApiStatus";
import { BrandMark } from "./BrandMark";

export function TopBar() {
  const { sourceFilter, setSourceFilter, suppliers, reviewLoad, pushToast } = useWorkspace();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query, 220);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<ActivityEvent[]>([]);

  const searchRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api
      .overview()
      .then((data) => setNotifications(data.recent_activity.slice(0, 5)))
      .catch(() => setNotifications([]));
  }, []);

  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    api
      .search(debouncedQuery)
      .then((data) => {
        if (!cancelled) setResults(data.results);
      })
      .catch(() => setResults([]));
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (searchRef.current && !searchRef.current.contains(target)) setSearchOpen(false);
      if (bellRef.current && !bellRef.current.contains(target)) setNotificationsOpen(false);
      if (profileRef.current && !profileRef.current.contains(target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        document.getElementById("global-search")?.focus();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const goTo = (href: string) => {
    setSearchOpen(false);
    setQuery("");
    navigate(href);
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-30 flex h-16 items-center gap-4 border-b border-line/80 bg-white/85 px-4 shadow-[0_1px_0_rgba(16,42,67,0.03)] backdrop-blur-md lg:px-6">
      <Link to="/" className="flex shrink-0 items-center gap-2.5">
        <BrandMark />
        <span className="leading-tight">
          <span className="block text-[15px] font-semibold tracking-[-0.01em] text-ink">OfferLens</span>
          <span className="block text-[10.5px] font-medium tracking-[0.01em] text-muted">
            One product. Multiple suppliers. Clearer decisions.
          </span>
        </span>
      </Link>

      <ApiStatus />

      <div className="mx-1 hidden h-7 w-px bg-line lg:block" />

      <div ref={searchRef} className="relative hidden max-w-md flex-1 lg:block">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-subtle" />
        <input
          id="global-search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setSearchOpen(true);
          }}
          onFocus={() => setSearchOpen(true)}
          placeholder="Search properties, tours, supplier IDs…"
          className="input h-9 pl-8 pr-14 text-[13px]"
          aria-label="Global search"
        />
        <span className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded border border-line bg-slate-50 px-1.5 py-0.5 text-[10px] text-subtle lg:flex">
          <Command className="h-2.5 w-2.5" />K
        </span>
        {searchOpen && (query.trim().length >= 2 || results.length > 0) ? (
          <div className="absolute left-0 right-0 top-11 z-40 overflow-hidden rounded-xl border border-line bg-white shadow-pop">
            {results.length === 0 ? (
              <p className="px-3 py-3 text-[12.5px] text-muted">
                {query.trim().length < 2 ? "Type at least two characters." : "No matching products or listings."}
              </p>
            ) : (
              <ul className="max-h-80 overflow-y-auto scroll-thin">
                {results.map((result) => (
                  <li key={`${result.type}-${result.id}`}>
                    <button
                      type="button"
                      onClick={() => goTo(result.href)}
                      className="flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors hover:bg-[#F8FAFC]"
                    >
                      <span className="mt-0.5 rounded border border-line bg-slate-50 px-1 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-muted">
                        {result.type}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[12.5px] font-medium text-ink">{result.title}</span>
                        <span className="block truncate text-[11px] text-muted">{result.subtitle}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <label className="hidden items-center gap-1.5 md:flex">
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted">Source</span>
          <select
            value={sourceFilter}
            onChange={(event) => setSourceFilter(event.target.value)}
            className="select h-9 w-[168px] py-1 text-[12.5px]"
            aria-label="Inventory source selector"
          >
            <option value="all">All sources</option>
            {suppliers.map((supplier) => (
              <option key={supplier.code} value={supplier.code}>
                {supplier.name}
              </option>
            ))}
          </select>
        </label>

        <div ref={bellRef} className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen((open) => !open)}
            className="relative rounded-lg border border-line bg-white p-2 text-muted transition-colors hover:bg-[#F8FAFC] hover:text-ink"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {reviewLoad > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-teal px-1 text-[9.5px] font-semibold text-white">
                {reviewLoad}
              </span>
            ) : null}
          </button>
          {notificationsOpen ? (
            <div className="absolute right-0 top-11 z-40 w-80 overflow-hidden rounded-xl border border-line bg-white shadow-pop">
              <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
                <p className="text-[12.5px] font-semibold text-ink">Workspace activity</p>
                <span className="text-[10px] uppercase tracking-wide text-subtle">Demo data</span>
              </div>
              <ul className="max-h-72 overflow-y-auto scroll-thin divide-y divide-line">
                {notifications.map((event) => (
                  <li key={event.id} className="px-3.5 py-2.5">
                    <p className="text-[12.5px] font-medium leading-4 text-ink">{event.title}</p>
                    <p className="mt-0.5 text-[11px] leading-4 text-muted">{event.detail}</p>
                    <p className="mt-1 text-[10.5px] text-subtle">
                      {event.actor} · {relativeTime(event.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
              <Link
                to="/matches"
                onClick={() => setNotificationsOpen(false)}
                className="block border-t border-line px-3.5 py-2.5 text-[12px] font-medium text-teal-dark hover:bg-[#F8FAFC]"
              >
                Open match review queue →
              </Link>
            </div>
          ) : null}
        </div>

        <span className="hidden items-center gap-1.5 rounded-lg border border-navy/15 bg-navy/[0.04] px-2.5 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-navy sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-teal" />
          Demo workspace
        </span>

        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((open) => !open)}
            className="flex items-center gap-2 rounded-lg border border-line bg-white py-1 pl-1 pr-2 transition-colors hover:bg-[#F8FAFC]"
            aria-label="User profile"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-navy text-[11px] font-semibold text-white">
              AR
            </span>
            <span className="hidden leading-tight sm:block">
              <span className="block text-[12px] font-medium text-ink">Ananya Rao</span>
              <span className="block text-[10px] text-muted">Inventory operations</span>
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-subtle" />
          </button>
          {profileOpen ? (
            <div className="absolute right-0 top-11 z-40 w-60 overflow-hidden rounded-xl border border-line bg-white shadow-pop">
              <div className="border-b border-line px-3.5 py-3">
                <p className="text-[12.5px] font-semibold text-ink">Ananya Rao</p>
                <p className="text-[11px] text-muted">ananya.rao@demo-workspace.invalid</p>
                <p className="mt-1.5 inline-flex items-center gap-1 rounded border border-line bg-slate-50 px-1.5 py-0.5 text-[10px] text-muted">
                  <UserRound className="h-2.5 w-2.5" /> Agency operations · demo account
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  pushToast({ tone: "info", title: "Demo workspace", detail: "Account switching is out of scope in the prototype." });
                }}
                className="block w-full px-3.5 py-2 text-left text-[12.5px] text-ink hover:bg-[#F8FAFC]"
              >
                Switch workspace
              </button>
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  navigate("/settings");
                }}
                className="block w-full px-3.5 py-2 text-left text-[12.5px] text-ink hover:bg-[#F8FAFC]"
              >
                Workspace settings
              </button>
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  pushToast({ tone: "info", title: "Signed in as demo user", detail: "Authentication is not implemented in this prototype." });
                }}
                className="flex w-full items-center gap-1 border-t border-line px-3.5 py-2 text-left text-[12.5px] text-muted hover:bg-[#F8FAFC]"
              >
                <X className="h-3 w-3" /> Sign out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
