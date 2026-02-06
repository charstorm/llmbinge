import { BrowserRouter, Routes, Route } from "react-router";
import { useEffect } from "react";
import { HomePage } from "@/components/home/HomePage";
import { SessionLayout } from "@/components/layout/SessionLayout";
import { ToastContainer } from "@/components/common/ToastContainer";
import { ConfirmBanner } from "@/components/common/ConfirmBanner";
import { useConfigStore } from "@/stores/configStore";

function ArticlePlaceholder() {
  return <div>Article page (coming in Phase 6)</div>;
}

function MapPlaceholder() {
  return <div>Map page (coming in Phase 7)</div>;
}

function ConfigPlaceholder() {
  return <div>Config page (coming in Phase 5)</div>;
}

export function App() {
  const loadConfig = useConfigStore((s) => s.loadConfig);
  const loaded = useConfigStore((s) => s.loaded);

  useEffect(() => {
    if (!loaded) loadConfig();
  }, [loadConfig, loaded]);

  return (
    <BrowserRouter>
      <ToastContainer />
      <ConfirmBanner />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/session/:sessionId" element={<SessionLayout />}>
          <Route path="article/:nodeId" element={<ArticlePlaceholder />} />
          <Route path="map/:nodeId" element={<MapPlaceholder />} />
        </Route>
        <Route path="/config" element={<ConfigPlaceholder />} />
      </Routes>
    </BrowserRouter>
  );
}
