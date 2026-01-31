export function RecommendationsList() {
  return (
    <div className="space-y-2">
      <h3 className="font-semibold">Recommendations</h3>
      <ul className="list-inside space-y-2 text-sm text-[var(--color-text-secondary)]">
        <li>Add @emma as reviewer for PR #247</li>
        <li>Merge Feature 1 before Feature 2 (auth.js conflict)</li>
        <li>Feature 3 is ready to merge</li>
      </ul>
    </div>
  );
}
