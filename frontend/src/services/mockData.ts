import type { Branch, BranchDetail } from '../types/flow';
import type { Connection, Tool } from '../types/connections';

export const MOCK_BRANCHES: Branch[] = [
  {
    id: 'main',
    name: 'main',
    status: 'success',
    author: 'system',
  },
  {
    id: 'nwl-branch',
    name: 'nwl-branch',
    parent: 'main',
    pulledFrom: 'main',
    status: 'warning',
    author: 'team',
    conflicts: ['auth.js'],
  },
  {
    id: 'release/1.0',
    name: 'release/1.0',
    parent: 'main',
    pulledFrom: 'main',
    status: 'success',
    author: 'team',
  },
  {
    id: 'feature/auth-refactor',
    name: 'feature/auth-refactor',
    parent: 'nwl-branch',
    mergeInto: 'nwl-branch',
    pulledFrom: 'nwl-branch',
    author: 'sarah',
    status: 'critical',
    jiraTicket: 'JIRA-247',
    jiraTitle: 'Auth Refactor',
    prId: 247,
    prStatus: 'awaiting_review',
    daysWaiting: 3,
    filesModified: ['auth.js', 'user.js'],
    blocking: ['feature/login-ui', 'nwl-merge'],
  },
  {
    id: 'feature/login-ui',
    name: 'feature/login-ui',
    parent: 'nwl-branch',
    mergeInto: 'nwl-branch',
    pulledFrom: 'nwl-branch',
    author: 'mike',
    status: 'warning',
    jiraTicket: 'JIRA-248',
    jiraTitle: 'Login UI',
    prId: 248,
    daysWaiting: 1,
    filesModified: ['auth.js', 'login.jsx'],
    conflicts: ['feature/auth-refactor'],
  },
  {
    id: 'feature/api-endpoint',
    name: 'feature/api-endpoint',
    parent: 'nwl-branch',
    mergeInto: 'nwl-branch',
    pulledFrom: 'nwl-branch',
    author: 'emma',
    status: 'success',
    jiraTicket: 'JIRA-251',
    jiraTitle: 'API Endpoint',
    prId: 251,
  },
  {
    id: 'feature/auth-refactor/login',
    name: 'feature/auth-refactor/login',
    parent: 'feature/auth-refactor',
    mergeInto: 'feature/auth-refactor',
    pulledFrom: 'feature/auth-refactor',
    author: 'sarah',
    status: 'neutral',
    jiraTicket: 'JIRA-249',
    jiraTitle: 'Login sub-feature',
  },
];

export const MOCK_BRANCH_DETAILS: Record<string, BranchDetail> = {
  'feature/auth-refactor': {
    ...MOCK_BRANCHES.find((b) => b.id === 'feature/auth-refactor')!,
    owner: 'Sarah Chen',
    ownerTeam: 'Backend Team',
    jiraStatus: 'In Progress',
    jiraStoryPoints: 8,
    prCreatedAt: '2026-01-27T08:00:00Z',
    reviewers: ['@john', '@mike'],
    ciStatus: 'passed',
    bottleneck: {
      severity: 'CRITICAL',
      waitTimeHours: 72,
      deviationFactor: 6,
      rootCause: ['Both reviewers have 4+ pending PRs', 'Team avg capacity exceeded'],
      blockingCount: 2,
    },
    recommendation: {
      action: 'Add @emma as reviewer',
      rationale: 'She reviewed 3 similar auth PRs this month, has capacity (1 PR vs team avg 2.5)',
      expectedImpact: 'Reduce wait time by ~48 hours',
      alternatives: ['Split PR into smaller chunks'],
    },
  },
};

export const MOCK_CONNECTIONS: Connection[] = [
  { id: '1', source: 'github', target: 'jira', status: 'active', lastSync: '2026-01-30T10:00:00Z' },
  { id: '2', source: 'jira', target: 'slack', status: 'active', lastSync: '2026-01-30T10:00:00Z' },
];

export const AVAILABLE_TOOLS: Tool[] = [
  { id: 'github', name: 'GitHub', icon: 'github', category: 'version_control' },
  { id: 'jira', name: 'Jira', icon: 'jira', category: 'project_management' },
  { id: 'slack', name: 'Slack', icon: 'slack', category: 'communication' },
  { id: 'confluence', name: 'Confluence', icon: 'confluence', category: 'communication' },
  { id: 'servicenow', name: 'ServiceNow', icon: 'servicenow', category: 'crm' },
];
