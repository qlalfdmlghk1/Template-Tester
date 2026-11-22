/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{spec,test}.{ts,tsx}"],
    // DS 컴포넌트(달력·포털·포커스 트랩)를 userEvent로 다루는 테스트는 단독 실행 1~2초지만, 전체 병렬 실행 때
    // jsdom 부하로 기본 5초를 넘겨 실패했다(#104 리뷰 중 재현) — 실제 실패가 아닌 시간 초과라 여유를 둔다
    testTimeout: 15000,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.stories.{ts,tsx}", "src/test/**"],
    },
  },
});
