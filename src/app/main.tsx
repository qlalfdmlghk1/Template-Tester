import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles/index.css";
// DS 스타일은 Tailwind preflight 뒤에 로드해야 함 — preflight의 [type='button'] 배경 초기화가
// .cds-btn--* 와 specificity가 같아 순서로 결정되기 때문 (index.css의 `html body` 주석 참고)
import "@choi/ds/styles.css";
import { AppBrandStyle as DsBrandStyle } from "@choi/ds";
import { AuthProvider } from "./providers/AuthProvider";
import { BRAND_COLOR } from "@/shared/config/brand";
import { ToastProvider } from "@/shared/ui/molecules/AppToast";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DsBrandStyle color={BRAND_COLOR} />
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
