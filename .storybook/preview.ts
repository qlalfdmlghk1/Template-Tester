import type { Preview } from "storybook";
import "../src/app/styles/index.css";
// 앱 진입점(main.tsx)과 같은 순서 — preflight 뒤에 DS 스타일
import "@choi/ds/styles.css";
import { applyBrandTheme } from "@choi/ds";
import { BRAND_COLOR } from "../src/shared/config/brand";

// 앱(main.tsx의 AppBrandStyle)과 같은 DS 메인 색. 값은 shared/config/brand.ts 한 곳에서 온다.
// 적용 경로가 다른 이유: 앱은 React 트리 안에서 첫 화면부터 <style>을 렌더하는 AppBrandStyle을,
// Storybook은 decorator 없이 전역에서 한 번 거는 DS의 브라우저용 API applyBrandTheme을 쓴다 (같은 CSS 변수를 만든다).
applyBrandTheme(BRAND_COLOR);

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "light",
      values: [
        { name: "light", value: "#F9FAFB" },
        { name: "white", value: "#FFFFFF" },
        { name: "dark", value: "#1F2937" },
      ],
    },
  },
};

export default preview;
