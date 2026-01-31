import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, useRoutes } from "react-router-dom";
import routes from "~react-pages";
import "./index.css";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext.tsx";

// 인증이 필요 없는 경로 (vite-plugin-pages는 슬래시 없이 경로 생성)
const publicPaths = ["login", "signup"];

// routes를 가공하여 ProtectedRoute 적용
function processRoutes(routes: any[]): any[] {
  return routes.map((route) => {
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

function App() {
  const protectedRoutes = processRoutes(routes);
  return useRoutes(protectedRoutes);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
