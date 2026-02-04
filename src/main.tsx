import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, useRoutes } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import routes from "~react-pages";

function App() {
  return <Suspense fallback={<div>Loading...</div>}>{useRoutes(routes)}</Suspense>;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
