export interface Project {
  id: string;
  name: string;
  location: string;
  status: string;
  lastUpdated: string;
  _count?: {
    tasks: number;
    taskStatuses: number;
    lookahead: number;
  };
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  location?: string;
  estimatedTime?: number;
  completed?: boolean;
  dueDate?: string;
  phase?: string;
  trade?: string;
  ownerCompany?: string;
}

export interface LogEntry {
  id: string;
  projectId: string;
  date: string;
  content: string;
  author: string;
  notionId?: string | null;
  createdAt?: string;
}

export interface DailyLogEntry {
  projectId: string;
  date: string;
  weather: string;
  workPerformed: string;
  manpower: string;
  equipment: string;
  issuesDelays: string;
  photos: string[];
  author: string;
}

export interface OpenItem {
  id: string;
  projectId: string;
  description: string;
  priority: string;
  dueDate: string | null;
  status: string;
  createdAt?: string;
}

export interface ScheduleEntry {
  taskId: string;
  taskName: string;
  phase: string | null;
  trade: string | null;
  ownerCompany: string;
  days: Array<{
    date: string;
    label: string;
    symbol: string;
  }>;
}

export interface LookaheadData {
  legend: Record<string, string>;
  weekDates: string[];
  matrix: ScheduleEntry[];
}

export interface DashboardSummary {
  projectId: string;
  projectName: string;
  thisWeekStart: string;
  effectiveComplete: number;
  totalTasks: number;
  unlocked: number;
  blocked: number;
  callNow: number;
  openInspectionCount: number;
  healthScore: number;
  criticalPathTaskIds: string[];
  criticalPathDays: number;
  callNowDetails: Array<{
    taskId: string;
    taskName: string;
    ownerCompany: string;
    contacts: Array<{
      company: string;
      name: string;
      phone?: string | null;
      email?: string | null;
    }>;
  }>;
  assistantActions: string[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}
