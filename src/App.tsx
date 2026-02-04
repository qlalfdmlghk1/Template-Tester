import { useRoutes } from "react-router-dom";
import { Suspense } from "react";
import routes from "~react-pages";

export default function App() {
  console.log(
    "routes:",
    routes.map((r) => ({ path: r.path, children: r.children?.map((c: any) => c.path) })),
  );
  return <Suspense fallback={<div>Loading...</div>}>{useRoutes(routes)}</Suspense>;
}
