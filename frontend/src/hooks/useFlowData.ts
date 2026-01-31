import { useState, useCallback, useEffect } from 'react';
import type { Branch, BranchDetail } from '../types/flow';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export function useFlowData() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchDetailsCache, setBranchDetailsCache] = useState<Record<string, BranchDetail>>({});
  const [loading, setLoading] = useState(true);

  // Fetch branches on mount
  useEffect(() => {
    async function fetchBranches() {
      try {
        const res = await fetch(`${API_BASE}/api/v1/mock/branches`);
        if (res.ok) {
          const data = await res.json();
          setBranches(data.branches || []);
        }
      } catch (error) {
        console.error('Failed to fetch branches:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchBranches();
  }, []);

  const getBranchDetail = useCallback((id: string): BranchDetail | null => {
    // Return from cache if available
    if (branchDetailsCache[id]) {
      return branchDetailsCache[id];
    }

    // Fetch in background and update cache
    fetch(`${API_BASE}/api/v1/mock/branch/${encodeURIComponent(id)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setBranchDetailsCache((prev) => ({ ...prev, [id]: data }));
        }
      })
      .catch(console.error);

    // Return basic branch info while loading
    const branch = branches.find((b) => b.id === id);
    return branch ? ({ ...branch, owner: 'Loading...' } as BranchDetail) : null;
  }, [branches, branchDetailsCache]);

  return { branches, loading, getBranchDetail };
}
