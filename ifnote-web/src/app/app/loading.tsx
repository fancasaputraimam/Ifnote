/**
 * Route-level loading UI rendered by Next.js App Router whenever a
 * page boundary inside `/app/*` performs server-side data fetching
 * or compilation. Falls back to a light placeholder so the screen
 * never goes blank.
 *
 * The thin top progress bar is implemented as a CSS animation
 * (see `.route-progress-bar` in `globals.css`) and respects
 * `prefers-reduced-motion`.
 */
export default function AppLoading() {
  return (
    <>
      <div
        role="progressbar"
        aria-busy="true"
        aria-label="Memuat halaman"
        className="route-progress-bar"
      />
      <div className="page-enter px-4 py-6 sm:px-6">
        <div className="space-y-4">
          <div className="h-6 w-32 animate-pulse rounded-md bg-paper-200/70 dark:bg-ink-700/70" />
          <div className="h-4 w-56 animate-pulse rounded-md bg-paper-200/60 dark:bg-ink-700/60" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-2xl bg-paper-200/50 dark:bg-ink-700/50"
              />
            ))}
          </div>
          <div className="space-y-2 pt-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 animate-pulse rounded-2xl bg-paper-200/40 dark:bg-ink-700/40"
              />
            ))}
          </div>
        </div>
        <span className="sr-only">Memuat…</span>
      </div>
    </>
  );
}
