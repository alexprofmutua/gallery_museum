import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { readMuseumConfig } from "./src/private/config";
export default defineConfig(({ command, mode }) => {
  // Fail before Vite emits a bundle if a secret or incomplete configuration was supplied.
  const env = loadEnv(mode, process.cwd(), "VITE_");
  if (
    Object.entries(env).some(
      ([name, value]) =>
        /SERVICE_ROLE|SECRET|PRIVATE_KEY/i.test(name) ||
        value.startsWith("sb_secret_"),
    )
  )
    throw new Error(
      "Keep server credentials out of VITE_ environment variables.",
    );
  const privateConfig = readMuseumConfig({ ...env, DEV: command === "serve" });
  const personal = mode === "personal";
  if (personal && (command !== "serve" || privateConfig))
    throw new Error("Personal mode is only for the local development preview.");
  return {
    publicDir: personal ? ".local-museum" : "public",
    server: {
      ...(personal
        ? {
            host: "127.0.0.1",
            cors: false,
            headers: { "Cross-Origin-Resource-Policy": "same-origin" },
          }
        : {}),
      fs: {
        deny: [
          ".env",
          ".env.*",
          "*.{crt,pem}",
          "**/.git/**",
          "**/.local-museum/**",
        ],
      },
    },
    plugins: [
      react(),
      {
        name: "personal-preview-loopback",
        configResolved(config) {
          if (personal && config.server.host !== "127.0.0.1")
            throw new Error("The personal preview must bind to 127.0.0.1.");
        },
      },
    ],
    test: {
      environment: "jsdom",
      setupFiles: ["./src/tests/setup.ts"],
      include: ["src/**/*.test.{ts,tsx}"],
    },
  };
});
