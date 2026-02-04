import { useRoutes } from "react-router-dom";
import { Suspense } from "react";
import routes from "~react-pages";

// children만 그대로 통과시키는 빈 래퍼
function Wrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function processRoutes(routes: any[]): any[] {
  return routes.map((route) => {
    if (route.children) {
      return {
        ...route,
        children: processRoutes(route.children),
      };
    }
    return {
      ...route,
      element: route.element ? <Wrapper>{route.element}</Wrapper> : route.element,
    };
  });
}

export default function App() {
  return <Suspense fallback={<div>Loading...</div>}>{useRoutes(processRoutes(routes))}</Suspense>;
}
