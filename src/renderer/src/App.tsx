import { RouterProvider } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { initAgentApi } from "./agent-api";
import { registerBuiltInControlBars } from "./components/control-bars";
import { registerBuiltInStatusBars } from "./components/status-bars";
import { registerBuiltInWidgets } from "./components/widgets";
import { initializeConfig } from "./config";
import { ColonyProvider } from "./context/ColonyContext";
import { useIsMobilePhone } from "./hooks/useIsMobilePhone";
import { registerBuiltInLayers, useLayerStore } from "./layers";
import { logger } from "./lib/logger";
import { router } from "./router";
import { MobileNotSupportedScreen } from "./screens/MobileNotSupportedScreen";

/**
 * Prevent browser-level pinch-to-zoom gestures.
 * iOS Safari ignores the viewport meta tag's user-scalable=no,
 * so we need to intercept touch gestures at the document level.
 */
function usePreventBrowserZoom() {
  useEffect(() => {
    // Prevent pinch-to-zoom on touchmove (2+ fingers)
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // Prevent double-tap-to-zoom by intercepting gesturestart (Safari-specific)
    const handleGestureStart = (e: Event) => {
      e.preventDefault();
    };

    // Prevent gesturechange (Safari pinch gesture)
    const handleGestureChange = (e: Event) => {
      e.preventDefault();
    };

    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("gesturestart", handleGestureStart);
    document.addEventListener("gesturechange", handleGestureChange);

    return () => {
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("gesturestart", handleGestureStart);
      document.removeEventListener("gesturechange", handleGestureChange);
    };
  }, []);
}

export const App: React.FC = () => {
  usePreventBrowserZoom();
  const isMobilePhone = useIsMobilePhone();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize config first, then registries that depend on it
  useEffect(() => {
    async function initialize() {
      logger.info("Starting application initialization", ["lifecycle"]);

      // Load configuration from storage first (registries depend on it)
      await initializeConfig();
      logger.info("Config initialized, registering built-in components", [
        "lifecycle",
      ]);

      // Now register widgets/bars/layers (they read from config)
      registerBuiltInWidgets();
      registerBuiltInLayers();
      registerBuiltInControlBars();
      registerBuiltInStatusBars();
      useLayerStore.getState().initialize();

      // Expose window.game API for agent interaction
      initAgentApi();

      logger.info("Application initialization complete", ["lifecycle"]);
      setIsInitialized(true);
    }
    initialize();
  }, []);

  if (isMobilePhone) {
    return <MobileNotSupportedScreen />;
  }

  // Wait for initialization before rendering the app
  if (!isInitialized) {
    return null;
  }

  return (
    <ColonyProvider>
      <RouterProvider router={router} />
    </ColonyProvider>
  );
};
