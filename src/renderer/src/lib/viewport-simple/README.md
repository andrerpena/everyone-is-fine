# Simple Viewport - Learning Guide

This is a simplified version of the full Viewport to help you understand how viewports work, one concept at a time.

## What You'll Learn

### 1. **Basic Concept: What is a Viewport?**
A viewport is like a camera for your game world. It's a `Container` that:
- Holds all your game objects (sprites, graphics, etc.)
- Can be moved around (panning)
- Can be zoomed in/out (scaling)

When you move the viewport, everything inside it moves together.

### 2. **Key Insight: Position and Transform**
The viewport uses Pixi's built-in transform system:
```typescript
// Moving the viewport to the right makes the world appear to move left
viewport.x += 100;  // World shifts left
viewport.y += 50;   // World shifts up

// Scaling the viewport zooms the view
viewport.scale.x = 2;  // 2x zoom
viewport.scale.y = 2;
```

### 3. **Coordinate Systems**
There are two coordinate systems:
- **Screen coordinates**: Pixels on your canvas (0,0 is top-left of canvas)
- **World coordinates**: Positions in your game world (can be much larger)

The viewport transforms between these:
```typescript
const worldPos = viewport.screenToWorld(mouseX, mouseY);
const screenPos = viewport.worldToScreen(objectX, objectY);
```

## Implementation Levels

### Level 1: SimpleViewport (This One!)
**Concepts**: Basic panning with drag

Features:
- Drag to pan around the world
- Simple pointer event handling
- Coordinate conversion

What it teaches:
- How dragging changes the viewport position
- How `pointerdown`, `pointermove`, `pointerup` work together
- The relationship between screen and world coordinates

### Level 2: What the Full Viewport Adds
The full Viewport in [../viewport/Viewport.ts](../viewport/Viewport.ts) adds:

1. **Plugin System**: Modular features (drag, wheel zoom, etc.)
2. **Input Manager**: Centralized event handling, multi-touch support
3. **Zoom Controls**: Mouse wheel zooming, pinch-to-zoom
4. **Boundaries**: Keep the viewport within world bounds
5. **Smooth Animations**: Easing for zoom/pan
6. **Advanced Features**: Snap points, follow objects, etc.

## How Dragging Works

Here's the core logic explained:

```typescript
// 1. User presses pointer down
onPointerDown(event) {
  isDragging = true;
  lastPosition = event.global;  // Remember starting position
}

// 2. User moves pointer while pressed
onPointerMove(event) {
  if (!isDragging) return;

  // Calculate how much the pointer moved
  const deltaX = event.global.x - lastPosition.x;
  const deltaY = event.global.y - lastPosition.y;

  // Move the viewport by that amount (this is the magic!)
  viewport.x += deltaX;
  viewport.y += deltaY;

  lastPosition = event.global;  // Update for next frame
}

// 3. User releases pointer
onPointerUp() {
  isDragging = false;
}
```

**Why does this work?**
- The viewport is a Container with a transform
- Changing `viewport.x` moves everything inside it
- Moving the container right makes the world appear to move left (inverse relationship)

## Comparing to the Full Viewport

| Feature | SimpleViewport | Full Viewport |
|---------|---------------|---------------|
| Panning | ✅ Basic drag | ✅ Advanced (plugins, touch) |
| Zoom | ❌ | ✅ Wheel, pinch, programmatic |
| Multi-touch | ❌ | ✅ |
| Animations | ❌ | ✅ Smooth easing |
| Boundaries | ❌ | ✅ Clamp, bounce, etc. |
| Plugin System | ❌ | ✅ Drag, Wheel, and more |
| Events | Basic | Rich (moved, zoomed, etc.) |

## Try It Out

See [example.tsx](./example.tsx) for a working example you can use in your app.

## Next Steps

Once you understand this simple version:
1. Look at [../viewport/plugins/Drag.ts](../viewport/plugins/Drag.ts) to see advanced dragging
2. Check out [../viewport/InputManager.ts](../viewport/InputManager.ts) for event handling
3. Explore [../viewport/PluginManager.ts](../viewport/PluginManager.ts) for the plugin architecture
4. Read [../viewport/Viewport.ts](../viewport/Viewport.ts) to see how it all comes together

## Key Takeaways

1. **A viewport is just a Container with position/scale control**
2. **Dragging = changing the container's position**
3. **Zooming = changing the container's scale**
4. **Coordinate conversion uses Pixi's built-in `toLocal()` and `toGlobal()`**
5. **The full viewport builds on these basics with plugins and features**

Start simple, understand the fundamentals, then add complexity! 🚀
