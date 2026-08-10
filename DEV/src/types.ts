export type Status = 'todo' | 'in-progress' | 'completed';
export type Level = 'low' | 'medium' | 'high';

export interface Project {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  progress: number;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  time?: string;
  importance: Level;
  urgency: Level;
  progress: number;
  status: Status;
  projectId: string;
  parentId?: string;
  dueLabel?: string;
}

export interface PlannerEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime?: string;
  relatedTaskId?: string;
}

export type AppRoute = 'today' | 'priority' | 'timeline' | 'calendar' | 'projects' | 'inbox' | 'completed' | 'archive' | 'settings';
