import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  meta,
  media,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
  /** Optional leading visual (e.g. an illustrative placeholder tile). */
  media?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex min-w-0 items-start gap-3.5">
        {media ? <div className="mt-1 hidden shrink-0 sm:block">{media}</div> : null}
        <div className="min-w-0">
        {eyebrow ? (
          <p className="section-label mb-2 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-teal" />
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-[26px] font-semibold leading-8 tracking-[-0.02em] text-ink">{title}</h1>
        {description ? <p className="mt-2 max-w-3xl text-[13px] leading-6 text-muted">{description}</p> : null}
        {meta ? <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div> : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
