const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export async function fetchBranches() {
  const res = await fetch(`${API_BASE}/api/v1/mock/branches`);
  if (!res.ok) throw new Error('Failed to fetch branches');
  return res.json();
}

export async function fetchBranchDetail(id: string) {
  const res = await fetch(`${API_BASE}/api/v1/mock/branch/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error('Failed to fetch branch detail');
  return res.json();
}

export async function fetchWorkflow() {
  const res = await fetch(`${API_BASE}/api/v1/mock/workflow`);
  if (!res.ok) throw new Error('Failed to fetch workflow');
  return res.json();
}

export async function fetchChatHealth() {
  const res = await fetch(`${API_BASE}/api/v1/chat/health`);
  if (!res.ok) throw new Error('Failed to check chat health');
  return res.json();
}
