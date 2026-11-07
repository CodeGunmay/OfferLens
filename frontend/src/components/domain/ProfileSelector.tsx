import { Sliders, UserRound } from "lucide-react";
import type { ClientProfile } from "../../types";
import { Button } from "../ui/Button";

export function ProfileSelector({
  profiles,
  activeKey,
  onSelect,
  onCustomize,
}: {
  profiles: ClientProfile[];
  activeKey: string;
  onSelect: (key: string) => void;
  onCustomize: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {profiles.map((profile) => {
        const isActive = profile.key === activeKey;
        return (
          <button
            key={profile.key}
            type="button"
            onClick={() => onSelect(profile.key)}
            aria-pressed={isActive}
            className={`flex min-w-[142px] flex-1 items-start gap-2 rounded-xl border px-3 py-2.5 text-left transition-all sm:flex-none ${
              isActive
                ? "border-teal bg-teal-tint shadow-[0_0_0_1px_rgba(22,184,166,0.35)]"
                : "border-line bg-white hover:border-subtle hover:bg-[#FBFCFE]"
            }`}
          >
            <UserRound className={`mt-0.5 h-3.5 w-3.5 ${isActive ? "text-teal-dark" : "text-subtle"}`} />
            <span className="min-w-0">
              <span className={`block text-[12.5px] font-semibold ${isActive ? "text-navy" : "text-ink"}`}>
                {profile.name}
              </span>
              <span className="mt-0.5 block text-[10.5px] leading-4 text-muted">
                {Object.entries(profile.weights)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 2)
                  .map(([key, value]) => `${key} ${value}%`)
                  .join(" · ")}
              </span>
            </span>
          </button>
        );
      })}
      <Button size="sm" variant="secondary" icon={<Sliders className="h-3.5 w-3.5" />} onClick={onCustomize}>
        Customize preferences
      </Button>
    </div>
  );
}
