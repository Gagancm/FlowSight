export type BranchStatus = 'critical' | 'warning' | 'success' | 'neutral';

export interface Branch {
  id: string;
  name: string;
  parent?: string;
  author: string;
  status: BranchStatus;
  /** Branch this merges into (e.g. nwl-branch) */
  mergeInto?: string;
  /** Branch this was pulled from (e.g. main, nwl-branch) */
  pulledFrom?: string;
  jiraTicket?: string;
  jiraTitle?: string;
  prId?: number;
  prStatus?: string;
  daysWaiting?: number;
  filesModified?: string[];
  blocking?: string[];
  conflicts?: string[];
}

export interface BranchDetail extends Branch {
  owner: string;
  ownerTeam?: string;
  jiraStatus?: string;
  jiraStoryPoints?: number;
  prCreatedAt?: string;
  reviewers?: string[];
  ciStatus?: string;
  bottleneck?: BottleneckInfo;
  recommendation?: RecommendationInfo;
}

export interface BottleneckInfo {
  severity: string;
  waitTimeHours: number;
  deviationFactor?: number;
  rootCause?: string[];
  blockingCount?: number;
}

export interface RecommendationInfo {
  action: string;
  rationale: string;
  expectedImpact?: string;
  alternatives?: string[];
}
