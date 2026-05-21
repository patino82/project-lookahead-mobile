export interface Project {
  id: string;
  name: string;
  location: string;
  status: 'active' | 'completed' | 'on-hold';
  lastUpdated: string;
}

export interface LogEntry {
  id: string;
  projectId: string;
  date: string;
  content: string;
  author: string;
}

export interface OpenItem {
  id: string;
  projectId: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  status: 'open' | 'closed';
}

export interface ScheduleItem {
  id: string;
  projectId: string;
  task: string;
  startTime: string;
  endTime: string;
  date: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}
