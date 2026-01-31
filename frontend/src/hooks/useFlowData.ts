import { useState, useCallback } from 'react';
import { MOCK_BRANCHES, MOCK_BRANCH_DETAILS } from '../services/mockData';
import type { Branch, BranchDetail } from '../types/flow';

export function useFlowData() {
  const [branches] = useState<Branch[]>(MOCK_BRANCHES);

  const getBranchDetail = useCallback((id: string): BranchDetail | null => {
    return MOCK_BRANCH_DETAILS[id] ?? null;
  }, []);

  return { branches, getBranchDetail };
}
