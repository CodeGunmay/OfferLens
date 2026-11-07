interface Tab<T extends string> {
  id: T;
  label: string;
  count?: number;
}

export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
  size = "md",
}: {
  tabs: Tab<T>[];
  active: T;
  onChange: (id: T) => void;
  size?: "sm" | "md";
}) {
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-lg border border-line bg-white p-1">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`inline-flex items-center gap-1.5 rounded-md font-medium transition-colors ${
              size === "sm" ? "px-2.5 py-1 text-[12px]" : "px-3 py-1.5 text-[13px]"
            } ${isActive ? "bg-navy text-white shadow-sm" : "text-muted hover:bg-[#F1F5F9] hover:text-ink"}`}
          >
            {tab.label}
            {tab.count !== undefined ? (
              <span
                className={`rounded px-1 text-[10px] num ${
                  isActive ? "bg-white/15 text-white" : "bg-slate-100 text-muted"
                }`}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
