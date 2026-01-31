export function AISummaryPanel() {
  return (
    <div className="mt-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4">
      <h3 className="mb-3 flex items-center gap-2 font-semibold">
        🤖 AI Analysis
      </h3>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-[var(--color-critical)]">🔴</span>
          <span>3 Critical</span>
          <span className="text-[var(--color-text-muted)]">·</span>
          <span className="text-[var(--color-warning)]">⚠️</span>
          <span>2 Warnings</span>
          <span className="text-[var(--color-text-muted)]">·</span>
          <span className="text-[var(--color-success)]">✅</span>
          <span>5 Ready</span>
        </div>
        <p className="text-[var(--color-text-secondary)]">
          Top Priority: Feature 1 blocking 2 features · 72hr PR review delay
        </p>
        <p className="text-[var(--color-success)]">
          💡 Recommended: Add @emma as reviewer to unblock
        </p>
      </div>
    </div>
  );
}
