import { Fragment, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BranchGraphBox } from './BranchGraphBox';
import { BranchHoverPanel } from './BranchHoverPanel';
import { useFlowData } from '../../hooks/useFlowData';
import { useHoverPanel } from '../../hooks/useHoverPanel';
import type { Branch, BranchDetail } from '../../types/flow';

/** Build ordered list of (branch, depth) for tree display: main → NWL → features, with indentation. */
function buildBranchOrder(branches: Branch[]): { branch: Branch; depth: number }[] {
  const byParent = new Map<string, Branch[]>();
  for (const b of branches) {
    const parent = b.parent ?? '__root__';
    if (!byParent.has(parent)) byParent.set(parent, []);
    byParent.get(parent)!.push(b);
  }
  const ordered: { branch: Branch; depth: number }[] = [];
  function walk(parentId: string, depth: number) {
    const children = byParent.get(parentId);
    if (!children) return;
    for (const b of children) {
      ordered.push({ branch: b, depth });
      walk(b.id, depth + 1);
    }
  }
  walk('__root__', 0);
  return ordered;
}

export function BranchGraph() {
  const { branches, getBranchDetail } = useFlowData();
  const { hoveredItem, onHover } = useHoverPanel<Branch>();

  const orderedBranches = useMemo(() => buildBranchOrder(branches), [branches]);

  const hoveredDetail: BranchDetail | null = hoveredItem
    ? (getBranchDetail(hoveredItem.id) ?? ({ ...hoveredItem } as BranchDetail))
    : null;

  return (
    <motion.div
      className="flex flex-col lg:flex-row h-full gap-4 lg:gap-6"
      style={{ fontFamily: 'var(--font-sans)' }}
      initial={false}
      animate={{ opacity: 1 }}
    >
      <div className="flex flex-1 flex-col min-w-0">
        <div className="flex flex-col gap-2">
          {orderedBranches.length === 0 ? (
            <motion.p
              className="py-6 text-center text-sm text-[var(--color-text-muted)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              No branches to display
            </motion.p>
          ) : (
            orderedBranches.map(({ branch, depth }, index) => (
              <Fragment key={branch.id}>
                {index > 0 && orderedBranches[index - 1].branch.id === 'main' && (
                  <div
                    className="min-h-[72px] shrink-0"
                    aria-hidden
                    data-gap-for-nodes
                  />
                )}
                <BranchGraphBox
                  branch={branch}
                  depth={depth}
                  onHover={onHover}
                  index={index}
                />
              </Fragment>
            ))
          )}
        </div>
      </div>
      <BranchHoverPanel branch={hoveredDetail} />
    </motion.div>
  );
}
