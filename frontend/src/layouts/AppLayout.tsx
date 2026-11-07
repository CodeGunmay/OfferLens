import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { MobileNav } from "../components/layout/MobileNav";
import { Sidebar } from "../components/layout/Sidebar";
import { ToastStack } from "../components/layout/ToastStack";
import { TopBar } from "../components/layout/TopBar";

export function AppLayout() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-canvas">
      <TopBar />
      <Sidebar />
      <main className="pt-16 lg:pl-[264px]">
        <div className="mx-auto w-full max-w-[1500px] px-5 py-6 lg:px-8 lg:py-7">
          <MobileNav />
          <div key={location.pathname} className="animate-fade-in">
            <Outlet />
          </div>
        </div>
        <footer className="mx-auto w-full max-w-[1500px] px-5 pb-8 lg:px-8">
          <p className="border-t border-line pt-4 text-[11px] leading-5 text-subtle">
            OfferLens is a concept prototype built for a hackathon. It is not an official TBO product and does not use
            TBO branding. All supplier, price and performance data shown is synthetic demonstration data unless stated
            otherwise.
          </p>
        </footer>
      </main>
      <ToastStack />
    </div>
  );
}
