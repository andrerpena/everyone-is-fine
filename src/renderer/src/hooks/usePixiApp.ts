import type { Application, ApplicationOptions } from "pixi.js";
import { Application as PixiApplication } from "pixi.js";
import { useEffect, useRef } from "react";
import "pixi.js/unsafe-eval";

interface UsePixiAppOptions extends Partial<ApplicationOptions> {
  onSetup?: (app: Application) => void | Promise<void>;
}

export function usePixiApp(options: UsePixiAppOptions = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const optionsRef = useRef(options);

  // Keep options ref up to date
  useEffect(() => {
    optionsRef.current = options;
  });

  useEffect(() => {
    let isEffectActive = true;

    const setupPixi = async () => {
      if (!containerRef.current) return;

      const { onSetup, ...appOptions } = optionsRef.current;

      const app = new PixiApplication();
      await app.init({
        width: 1000,
        height: 1000,
        backgroundColor: 0x1a1a1a,
        antialias: true,
        ...appOptions,
      });

      if (!isEffectActive) {
        app.destroy(true, {
          children: true,
          texture: true,
        });
        return;
      }

      containerRef.current.appendChild(app.canvas);
      appRef.current = app;

      if (onSetup) {
        await onSetup(app);
      }
    };

    setupPixi();

    return () => {
      isEffectActive = false;
      if (appRef.current) {
        appRef.current.destroy(true, {
          children: true,
          texture: true,
        });
        appRef.current = null;
      }
    };
  }, []);

  return { containerRef, app: appRef.current };
}
