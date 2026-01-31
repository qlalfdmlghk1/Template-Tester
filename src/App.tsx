import { useRoutes, type RouteObject } from "react-router-dom";
import routes from "~react-pages";
import ProtectedRoute from "./components/ProtectedRoute";

// 인증이 필요 없는 경로 (vite-plugin-pages는 슬래시 없이 경로 생성)
const publicPaths = ["login", "signup"];

// routes를 가공하여 ProtectedRoute 적용
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

    // 인증이 필요한 경로는 ProtectedRoute로 감싸기
    return {
      ...route,
      element: route.element ? <ProtectedRoute>{route.element}</ProtectedRoute> : route.element,
    };
  });
}

export default function App() {
  const protectedRoutes = processRoutes(routes);
  return useRoutes(protectedRoutes);
}
