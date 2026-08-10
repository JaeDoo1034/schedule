import type { PlannerEvent, Project, Task } from '../types';

export interface PlannerRepository {
  getProjects(): Promise<Project[]>;
  getTasks(): Promise<Task[]>;
  getEvents(): Promise<PlannerEvent[]>;
}

const projects: Project[] = [
  { id: 'customer', title: '고객 분석 프로젝트', startDate: '2026-08-01', endDate: '2026-08-28', progress: 75, color: '#6758d7' },
  { id: 'llm', title: 'LLM 일정관리', startDate: '2026-08-05', endDate: '2026-09-05', progress: 50, color: '#2f9d8f' },
  { id: 'personal', title: '개인 업무', startDate: '2026-08-10', endDate: '2026-08-31', progress: 30, color: '#e19146' },
];

const tasks: Task[] = [
  { id: 'standup', title: '팀 데일리 스탠드업', startDate: '2026-08-14', endDate: '2026-08-14', time: '09:00', importance: 'medium', urgency: 'medium', progress: 100, status: 'completed', projectId: 'customer' },
  { id: 'analysis', title: '데이터 분석', startDate: '2026-08-14', endDate: '2026-08-14', time: '10:30', importance: 'high', urgency: 'medium', progress: 60, status: 'completed', projectId: 'customer' },
  { id: 'meeting-task', title: '팀 회의', startDate: '2026-08-14', endDate: '2026-08-14', time: '15:00', importance: 'high', urgency: 'medium', progress: 0, status: 'todo', projectId: 'llm' },
  { id: 'draft-review', title: '보고서 초안 검토', startDate: '2026-08-14', endDate: '2026-08-14', time: '17:00', importance: 'medium', urgency: 'high', progress: 0, status: 'todo', projectId: 'customer' },
  { id: 'root-cause', title: '장애 원인 분석', startDate: '2026-08-14', endDate: '2026-08-14', importance: 'high', urgency: 'high', progress: 20, status: 'in-progress', projectId: 'customer', dueLabel: '오늘 마감' },
  { id: 'report', title: '보고서 작성', startDate: '2026-08-14', endDate: '2026-08-15', importance: 'high', urgency: 'high', progress: 30, status: 'in-progress', projectId: 'customer', dueLabel: '내일 마감' },
  { id: 'proposal', title: '신규 서비스 기획안', startDate: '2026-08-14', endDate: '2026-08-18', importance: 'high', urgency: 'medium', progress: 60, status: 'in-progress', projectId: 'llm', dueLabel: '8월 18일 마감' },
];

const events: PlannerEvent[] = [
  { id: 'event-standup', title: '팀 데일리 스탠드업', date: '2026-08-14', startTime: '09:00', endTime: '09:20', relatedTaskId: 'standup' },
  { id: 'event-meeting', title: '팀 회의', date: '2026-08-14', startTime: '15:00', endTime: '16:00', relatedTaskId: 'meeting-task' },
];

export const mockRepository: PlannerRepository = {
  async getProjects() { return structuredClone(projects); },
  async getTasks() { return structuredClone(tasks); },
  async getEvents() { return structuredClone(events); },
};

export { projects as initialProjects, tasks as initialTasks, events as initialEvents };
