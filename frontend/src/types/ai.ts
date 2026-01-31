export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Recommendation {
  id: string;
  branchId?: string;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'success';
  action?: string;
  actionLabel?: string;
}
