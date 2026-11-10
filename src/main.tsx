import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { StartupError } from "./app/StartupError";
import { readMuseumConfig } from "./private/config";
import "./app/styles.css";

const root = createRoot(document.getElementById("root")!);
root.render(
  <div className="loading" role="status">
    Preparing your museum…
  </div>,
);

async function start() {
  const config = readMuseumConfig({
    VITE_MUSEUM_MODE: import.meta.env.VITE_MUSEUM_MODE,
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env
      .VITE_SUPABASE_PUBLISHABLE_KEY,
    VITE_MUSEUM_ID: import.meta.env.VITE_MUSEUM_ID,
    DEV: import.meta.env.DEV,
  });
  if (config) {
    const { PrivateEntry } = await import("./private/PrivateEntry");
    // The entry owns authorization and mounts the museum only after the grant.
    root.render(<PrivateEntry config={config} />);
  } else {
    if (import.meta.env.DEV && import.meta.env.MODE === "personal") {
      const { loadPersonalCatalog } = await import("./content/museum");
      await loadPersonalCatalog();
    }
    const { default: App } = await import("./app/App");
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  }
}
void start().catch(() => {
  root.render(<StartupError />);
});
