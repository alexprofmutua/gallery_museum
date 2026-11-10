import { lazy, Suspense, useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { clearPrivateCatalog } from "../content/museum";
import type { PrivateConfig } from "./config";
import { createPrivateClient, loadPrivateVisit, signOut } from "./session";
import type { PrivateVisit } from "./session";

const App = lazy(() => import("../app/App"));

function EntryPanel({ children }: { children: ReactNode }) {
  return (
    <main className="private-entry">
      <section>
        <span className="eyebrow">OUR FOREVER MUSEUM</span>
        <h1>Private visit</h1>
        {children}
      </section>
    </main>
  );
}

function SignIn({ client }: { client: SupabaseClient }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      if (!sent) {
        await client.auth.signInWithOtp({
          email: email.trim(),
          options: { shouldCreateUser: false },
        });
        setSent(true);
        setMessage(
          "If your address is invited, look for a code in your inbox.",
        );
      } else {
        const { error } = await client.auth.verifyOtp({
          email: email.trim(),
          token: code.trim(),
          type: "email",
        });
        if (error)
          setMessage(
            "That code couldn’t be verified. Try again or request a new code.",
          );
        else window.location.reload();
      }
    } catch {
      setMessage("The sign-in service is unavailable. Try again shortly.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <EntryPanel>
      <p>Use the email address on your invitation.</p>
      <form onSubmit={(event) => void submit(event)}>
        <label>
          Email address
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            readOnly={sent}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        {sent && (
          <label>
            Email code
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6,10}"
              required
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
          </label>
        )}
        <button className="primary" disabled={busy}>
          {sent ? "Verify code" : "Send code"}
        </button>
        {sent && (
          <button
            className="text-button"
            type="button"
            disabled={busy}
            onClick={() => {
              setSent(false);
              setCode("");
              setMessage("");
            }}
          >
            Change email or request a new code
          </button>
        )}
        <p role="status">{message}</p>
      </form>
    </EntryPanel>
  );
}

export function PrivateEntry({ config }: { config: PrivateConfig }) {
  const [client] = useState(() => createPrivateClient(config));
  const [state, setState] = useState<
    | { kind: "loading" | "sign-in" }
    | { kind: "blocked"; message: string }
    | { kind: "ready"; visit: PrivateVisit }
  >({ kind: "loading" });

  useEffect(() => {
    let active = true;
    async function open() {
      try {
        const {
          data: { session },
          error,
        } = await client.auth.getSession();
        if (!active) return;
        if (!session || error) {
          setState({ kind: "sign-in" });
          return;
        }
        const visit = await loadPrivateVisit(
          config,
          client,
          session.access_token,
        );
        if (active) setState({ kind: "ready", visit });
      } catch (failure) {
        if (active)
          setState({
            kind: "blocked",
            message:
              failure instanceof Error && failure.name === "Error"
                ? failure.message
                : "The private museum is temporarily unavailable.",
          });
      }
    }
    void open();
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        active = false;
        clearPrivateCatalog();
        window.location.reload();
      }
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [client, config]);

  useEffect(() => {
    if (state.kind !== "ready") return;
    const expire = () => {
      if (Date.now() >= state.visit.expiresAt) {
        setState({
          kind: "blocked",
          message: "This visit expired. Reopen it to continue.",
        });
        clearPrivateCatalog();
      }
    };
    const timer = window.setTimeout(
      expire,
      Math.max(0, state.visit.expiresAt - Date.now()),
    );
    document.addEventListener("visibilitychange", expire);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", expire);
    };
  }, [state]);

  if (state.kind === "sign-in") return <SignIn client={client} />;
  if (state.kind === "ready")
    return (
      <Suspense
        fallback={
          <EntryPanel>
            <p role="status">Preparing your museum…</p>
          </EntryPanel>
        }
      >
        <App privateVisit={state.visit} />
      </Suspense>
    );
  if (state.kind === "blocked")
    return (
      <EntryPanel>
        <p role="alert">{state.message}</p>
        <button className="primary" onClick={() => window.location.reload()}>
          Reopen private visit
        </button>
        <button
          className="text-button"
          onClick={() => void signOut(client, config)}
        >
          Sign out
        </button>
      </EntryPanel>
    );
  return (
    <EntryPanel>
      <p role="status">Checking your invitation…</p>
    </EntryPanel>
  );
}
