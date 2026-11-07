import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import { Analytics } from "./pages/Analytics";
import { ContentEnrichment } from "./pages/ContentEnrichment";
import { HotelDetail } from "./pages/HotelDetail";
import { HotelInventory } from "./pages/HotelInventory";
import { MatchReview } from "./pages/MatchReview";
import { NotFound } from "./pages/NotFound";
import { OfferComparison } from "./pages/OfferComparison";
import { Overview } from "./pages/Overview";
import { RankingIntelligence } from "./pages/RankingIntelligence";
import { Settings } from "./pages/Settings";
import { SightseeingDetail } from "./pages/SightseeingDetail";
import { SightseeingInventory } from "./pages/SightseeingInventory";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Overview />} />
        <Route path="/hotels" element={<HotelInventory />} />
        <Route path="/hotels/:code" element={<HotelDetail />} />
        <Route path="/sightseeing" element={<SightseeingInventory />} />
        <Route path="/sightseeing/:code" element={<SightseeingDetail />} />
        <Route path="/matches" element={<MatchReview />} />
        <Route path="/compare" element={<OfferComparison />} />
        <Route path="/ranking" element={<RankingIntelligence />} />
        <Route path="/enrichment" element={<ContentEnrichment />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/overview" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
