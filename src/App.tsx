import { useRoutes } from "react-router-dom";
import { Suspense } from "react";
import routes from "~react-pages";

// 아무것도 안 하고 그냥 그대로 반환 (children 재귀만 테스트)
function processRoutes(routes: any[]): any[] {
  return routes.map((route) => {
    if (route.children) {
      return {
        ...route,
        children: processRoutes(route.children),
      };
    }
    return { ...route };
  });
}

export default function App() {
  console.log("원본 routes:", JSON.stringify(routes, null, 2));
  const processed = processRoutes(routes);
  console.log("가공 routes:", JSON.stringify(processed, null, 2));
  return <Suspense fallback={<div>Loading...</div>}>{useRoutes(processed)}</Suspense>;
}
