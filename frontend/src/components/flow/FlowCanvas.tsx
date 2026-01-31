import { BranchCard } from './BranchCard';
import { BranchHoverPanel } from './BranchHoverPanel';
import { AISummaryPanel } from './AISummaryPanel';
import { useFlowData } from '../../hooks/useFlowData';
import { useHoverPanel } from '../../hooks/useHoverPanel';
import type { Branch, BranchDetail } from '../../types/flow';

export function FlowCanvas() {
  const { branches, getBranchDetail } = useFlowData();
  const { hoveredItem, onHover } = useHoverPanel<Branch>();

  const mainBranch = branches.find((b) => b.id === 'main');
  const stagingBranch = branches.find((b) => b.id === 'nwl-branch');
  const featureBranches = branches.filter((b) => b.parent === 'nwl-branch');

  const hoveredDetail: BranchDetail | null = hoveredItem
    ? (getBranchDetail(hoveredItem.id) ?? ({ ...hoveredItem } as BranchDetail))
    : null;

  return (
    <div className="flex h-full gap-6">
      <div className="flex flex-1 flex-col">
        <div className="mb-4 flex gap-4">
          <select className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-sm">
            <option>All Branches</option>
          </select>
          <select className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-sm">
            <option>All Status</option>
          </select>
          <select className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-sm">
            <option>Sort: Priority</option>
          </select>
        </div>
        <div className="relative flex flex-col items-center gap-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-8">
          {mainBranch && (
            <div>
              <BranchCard branch={mainBranch} onHover={onHover} />
            </div>
          )}
          {mainBranch && (
            <div className="h-8 w-0.5 bg-[var(--color-border)]" />
          )}
          {stagingBranch && (
            <div>
              <BranchCard branch={stagingBranch} onHover={onHover} />
            </div>
          )}
          {stagingBranch && (
            <div className="h-8 w-0.5 bg-[var(--color-border)]" />
          )}
          <div className="flex flex-wrap justify-center gap-6">
            {featureBranches.map((branch) => (
              <BranchCard key={branch.id} branch={branch} onHover={onHover} />
            ))}
          </div>
        </div>
        <AISummaryPanel />
      </div>
      <BranchHoverPanel branch={hoveredDetail} />
    </div>
  );
}
