export function StartupError() {
  return (
    <main className="scene-error">
      <h1>The collection couldn’t load.</h1>
      <p>Please contact the museum owner or try reloading.</p>
      <button className="primary" onClick={() => window.location.reload()}>
        Reload museum
      </button>
    </main>
  );
}
