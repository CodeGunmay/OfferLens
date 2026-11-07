import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  padded = false,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return <section className={`card ${padded ? "p-5" : ""} ${className}`}>{children}</section>;
}

export function CardHeader({
  title,
  subtitle,
  actions,
  badge,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  badge?: ReactNode;
}) {
  return (
    <header className="card-header">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="card-title">{title}</h2>
          {badge}
        </div>
        {subtitle ? <p className="card-sub max-w-3xl">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function CardBody({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}

export function CardFooter({ children }: { children: ReactNode }) {
  return <div className="border-t border-line bg-[#FBFCFE] px-5 py-3 text-xs text-muted">{children}</div>;
}
