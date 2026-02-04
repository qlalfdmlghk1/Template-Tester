import { useRoutes } from "react-router-dom";
import { Suspense } from "react";
import routes from "~react-pages";

export default function App() {
  // processRoutes 없이, routes를 단순 복사만
  const copied = routes.map((r) => ({ ...r }));
  return <Suspense fallback={<div>Loading...</div>}>{useRoutes(copied)}</Suspense>;
}
