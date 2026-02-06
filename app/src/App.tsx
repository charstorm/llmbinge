import { BrowserRouter, Routes, Route } from "react-router";
import { useEffect } from "react";
import { HomePage } from "@/components/home/HomePage";
import { SessionLayout } from "@/components/layout/SessionLayout";
import { ArticlePage } from "@/components/article/ArticlePage";
import { MapPage } from "@/components/map/MapPage";
import { ConfigPage } from "@/components/config/ConfigPage";
import { ToastContainer } from "@/components/common/ToastContainer";
import { ConfirmBanner } from "@/components/common/ConfirmBanner";
import { DevMarkdown } from "@/pages/dev/DevMarkdown";
import { DevMapLayout } from "@/pages/dev/DevMapLayout";
import { DevStorage } from "@/pages/dev/DevStorage";
import { DevTree } from "@/pages/dev/DevTree";
import { useConfigStore } from "@/stores/configStore";

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
          <Route path="article/:nodeId" element={<ArticlePage />} />
          <Route path="map/:nodeId" element={<MapPage />} />
        </Route>
        <Route path="/config" element={<ConfigPage />} />
        <Route path="/__dev/test-markdown" element={<DevMarkdown />} />
        <Route path="/__dev/test-map" element={<DevMapLayout />} />
        <Route path="/__dev/storage" element={<DevStorage />} />
        <Route path="/__dev/tree" element={<DevTree />} />
      </Routes>
    </BrowserRouter>
  );
}
