/**
 * SIMPLE VIEWPORT EXAMPLE
 *
 * This shows how to use the SimpleViewport in a React component.
 * Copy this to your components folder to try it out!
 */

import { Graphics } from "pixi.js";
import type React from "react";
import { usePixiApp } from "../../hooks/usePixiApp";
import { SimpleViewport } from "./SimpleViewport";

const SimpleViewportExample: React.FC = () => {
  const { containerRef } = usePixiApp({
    width: 800,
    height: 600,
    backgroundColor: 0x1a1a1a,
    antialias: true,
    onSetup: (app) => {
      // Create the viewport
      const viewport = new SimpleViewport({
        screenWidth: 800,
        screenHeight: 600,
      });

      // Add viewport to the stage
      app.stage.addChild(viewport);

      // Attach wheel zoom to the canvas
      viewport.attachWheelZoom(app.canvas);

      // Now add some objects to the world
      // These will all move together when you drag the viewport

      // Create a grid to show the world coordinates
      const grid = new Graphics();
      const gridSize = 100;
      const gridColor = 0x333333;

      // Draw vertical lines
      for (let x = 0; x <= 5000; x += gridSize) {
        grid.moveTo(x, 0);
        grid.lineTo(x, 5000);
        grid.stroke({ width: 1, color: gridColor });
      }

      // Draw horizontal lines
      for (let y = 0; y <= 5000; y += gridSize) {
        grid.moveTo(0, y);
        grid.lineTo(5000, y);
        grid.stroke({ width: 1, color: gridColor });
      }

      viewport.addChild(grid);

      // Add some colorful squares at different positions
      const colors = [
        0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff,
      ];

      for (let i = 0; i < 6; i++) {
        const square = new Graphics();
        square.rect(0, 0, 80, 80);
        square.fill(colors[i]);

        // Position squares in different areas of the world
        square.x = 200 + (i % 3) * 300;
        square.y = 200 + Math.floor(i / 3) * 300;

        viewport.addChild(square);
      }

      // Add a large rectangle to show world bounds
      const worldBounds = new Graphics();
      worldBounds.rect(0, 0, 2000, 2000);
      worldBounds.stroke({ width: 3, color: 0xffffff });
      viewport.addChild(worldBounds);

      // Log initial info
      console.log("SimpleViewport Example loaded!");
      console.log("Try dragging to pan, scrolling to zoom");
      console.log(`Initial viewport position: (${viewport.x}, ${viewport.y})`);

      const bounds = viewport.getVisibleBounds();
      console.log(
        `Visible world area: (${bounds.left}, ${bounds.top}) to (${bounds.right}, ${bounds.bottom})`,
      );
    },
  });

  return (
    <div>
      <div
        style={{
          padding: "10px",
          backgroundColor: "#2a2a2a",
          color: "#fff",
          marginBottom: "10px",
        }}
      >
        <h3>Simple Viewport Example</h3>
        <p>
          <strong>Instructions:</strong> Click and drag to pan, scroll wheel to
          zoom
        </p>
        <p>
          <strong>What you're seeing:</strong> A 2000x2000 world with a grid,
          colored squares, and a white border
        </p>
      </div>
      <div ref={containerRef} />
    </div>
  );
};

export default SimpleViewportExample;
