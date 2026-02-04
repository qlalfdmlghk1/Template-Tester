import { useRoutes, type RouteObject } from "react-router-dom";
import { Suspense } from "react"; // 추가
import routes from "~react-pages";
import ProtectedRoute from "./components/ProtectedRoute";

const publicPaths = ["Login", "Signup"];

function processRoutes(routes: RouteObject[]): RouteObject[] {
  return routes.map((route): RouteObject => {
    const normalizedPath = (route.path || "").replace(/^\//, "");
    const isPublic = publicPaths.includes(normalizedPath);

    if (route.children) {
      return {
        ...route,
        children: processRoutes(route.children),
      };
    }

    if (isPublic) {
      return route;
    }

    return {
      ...route,
      element: route.element ? <ProtectedRoute>{route.element}</ProtectedRoute> : route.element,
    };
  });
}

export default function App() {
  const protectedRoutes = processRoutes(routes);
  return <Suspense fallback={<div>Loading...</div>}>{useRoutes(protectedRoutes)}</Suspense>;
}
