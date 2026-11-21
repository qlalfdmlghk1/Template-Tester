import type { Preview } from "storybook";
import "../src/app/styles/index.css";
// 앱 진입점(main.tsx)과 같은 순서 — preflight 뒤에 DS 스타일
import "@choi/ds/styles.css";
import { applyBrandTheme } from "@choi/ds";
import { BRAND_COLOR } from "../src/shared/config/brand";

// 앱(main.tsx의 BrandStyle)과 같은 DS 메인 색
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
