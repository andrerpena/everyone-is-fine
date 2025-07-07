import { createRootRoute, createRoute, Outlet } from "@tanstack/react-router";
import { GameScreen } from "../screens/GameScreen";
import { HomeScreen } from "../screens/HomeScreen";

// Root route - provides layout wrapper
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// Home screen route
const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/home",
  component: HomeScreen,
});

// Game screen route (temporarily set as default)
const gameRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: GameScreen,
});

// Build the route tree
export const routeTree = rootRoute.addChildren([homeRoute, gameRoute]);
