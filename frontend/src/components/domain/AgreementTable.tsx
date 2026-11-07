import { AlertTriangle, Check, Minus } from "lucide-react";
import type { AgreementRow } from "../../types";

const STATUS = {
  match: { icon: Check, tone: "text-emerald-600", label: "Agrees" },
  partial: { icon: Minus, tone: "text-sky-600", label: "Partial" },
  conflict: { icon: AlertTriangle, tone: "text-amber-600", label: "Conflict" },
  missing: { icon: Minus, tone: "text-slate-400", label: "Missing" },
};

export function AgreementTable({ rows }: { rows: AgreementRow[] }) {
  return (
    <div className="overflow-x-auto scroll-thin">
      <table className="table">
        <thead>
          <tr>
            <th className="th w-[140px]">Attribute</th>
            <th className="th">Supplier values</th>
            <th className="th w-[110px]">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const status = STATUS[row.status];
            const Icon = status.icon;
            return (
              <tr key={row.attribute} className="row-hover">
                <td className="td font-medium">{row.attribute}</td>
                <td className="td">
                  <div className="space-y-1">
                    {row.values.map((value) => (
                      <div key={`${row.attribute}-${value.supplier}`} className="flex gap-2">
                        <span className="w-[132px] shrink-0 text-[11.5px] text-muted">{value.supplier}</span>
                        <span className="num text-[12px] text-ink">{String(value.value ?? "—")}</span>
                      </div>
                    ))}
                    {row.shared && row.shared.length > 0 ? (
                      <p className="mt-1 text-[11px] leading-4 text-muted">
                        Agreed: {row.shared.join(", ")}
                      </p>
                    ) : null}
                    {row.partial && row.partial.length > 0 ? (
                      <p className="text-[11px] leading-4 text-amber-700">Supplier-specific: {row.partial.join(", ")}</p>
                    ) : null}
                    {row.note ? <p className="text-[11px] leading-4 text-subtle">{row.note}</p> : null}
                  </div>
                </td>
                <td className="td">
                  <span className={`inline-flex items-center gap-1 text-[11.5px] font-medium ${status.tone}`}>
                    <Icon className="h-3 w-3" /> {status.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
