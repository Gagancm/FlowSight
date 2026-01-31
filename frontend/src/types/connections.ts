export interface Connection {
  id: string;
  source: ToolType;
  target: ToolType;
  status: 'active' | 'inactive' | 'error' | 'syncing';
  lastSync?: string;
}

export type ToolType = 'github' | 'jira' | 'slack' | 'confluence' | 'servicenow';

export interface Tool {
  id: ToolType;
  name: string;
  icon: string;
  category: 'version_control' | 'project_management' | 'communication' | 'crm';
}
