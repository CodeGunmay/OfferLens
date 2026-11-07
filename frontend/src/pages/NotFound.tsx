import { Compass } from "lucide-react";
import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-line bg-white px-6 py-24 text-center">
      <Compass className="h-6 w-6 text-subtle" />
      <h1 className="mt-3 text-[18px] font-semibold text-ink">This view does not exist</h1>
      <p className="mt-1 max-w-md text-[13px] text-muted">
        The page you tried to open is not part of the OfferLens prototype. Use the sidebar to return to a workspace
        module.
      </p>
      <Link to="/" className="btn-primary mt-4">
        Back to overview
      </Link>
    </div>
  );
}
