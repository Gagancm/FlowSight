/**
 * Connections context imported into AI chat when user clicks the AI button
 * from a project on the Connections page.
 */
export interface AIConnectionsContext {
  projectId: string;
  projectName: string;
  tools: { id: string; name: string }[];
  edges: { sourceLabel: string; targetLabel: string }[];
}

export const AI_CONNECTIONS_CONTEXT_KEY = 'flowsight-ai-connections-context';

export function saveConnectionsContextForAI(context: AIConnectionsContext): void {
  try {
    sessionStorage.setItem(AI_CONNECTIONS_CONTEXT_KEY, JSON.stringify(context));
  } catch {
    // ignore
  }
}

export function loadConnectionsContextForAI(): AIConnectionsContext | null {
  try {
    const raw = sessionStorage.getItem(AI_CONNECTIONS_CONTEXT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AIConnectionsContext;
    if (
      parsed &&
      typeof parsed.projectId === 'string' &&
      typeof parsed.projectName === 'string' &&
      Array.isArray(parsed.tools) &&
      Array.isArray(parsed.edges)
    ) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

export function clearConnectionsContextForAI(): void {
  try {
    sessionStorage.removeItem(AI_CONNECTIONS_CONTEXT_KEY);
  } catch {
    // ignore
  }
}
