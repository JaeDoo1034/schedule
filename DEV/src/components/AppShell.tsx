import type { PropsWithChildren } from 'react';
import { Archive, CalendarDays, CheckCircle2, FolderKanban, Home, Inbox, ListTodo, PanelLeftClose, Settings, TimerReset } from 'lucide-react';
import type { AppRoute, Project } from '../types';

const groups = [
  { label: '', items: [{ id: 'today', label: '오늘', Icon: Home }] },
  { label: '주요 보기', items: [{ id: 'priority', label: '우선순위', Icon: ListTodo }, { id: 'timeline', label: '간트차트', Icon: TimerReset }, { id: 'calendar', label: '캘린더', Icon: CalendarDays }] },
  { label: '기타', items: [{ id: 'inbox', label: '받은 작업함', Icon: Inbox }, { id: 'completed', label: '완료된 작업', Icon: CheckCircle2 }, { id: 'archive', label: '보관함', Icon: Archive }] },
] as const;

interface Props extends PropsWithChildren { route: AppRoute; onNavigate: (route: AppRoute) => void; projects: Project[] }

export function AppShell({ route, onNavigate, projects, children }: Props) {
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark"><CheckCircle2 size={18} /></span><span>My Planner</span><PanelLeftClose className="collapse-icon" size={17} /></div>
      <nav>
        {groups.slice(0, 2).map((group) => <div className="nav-group" key={group.label || 'home'}>
          {group.label && <p className="nav-label">{group.label}</p>}
          {group.items.map(({ id, label, Icon }) => <button className={`nav-item ${route === id ? 'active' : ''}`} key={id} onClick={() => onNavigate(id)}><Icon size={17} /><span>{label}</span></button>)}
        </div>)}
        <div className="nav-group"><p className="nav-label">프로젝트</p>
          {projects.map((project) => <button className="nav-item project-nav" key={project.id} onClick={() => onNavigate('projects')}><i style={{ background: project.color }} /> <span>{project.title}</span></button>)}
        </div>
        {groups.slice(2).map((group) => <div className="nav-group" key={group.label}><p className="nav-label">{group.label}</p>{group.items.map(({ id, label, Icon }) => <button className={`nav-item ${route === id ? 'active' : ''}`} key={id} onClick={() => onNavigate(id)}><Icon size={17} /><span>{label}</span></button>)}</div>)}
      </nav>
      <button className={`nav-item settings ${route === 'settings' ? 'active' : ''}`} onClick={() => onNavigate('settings')}><Settings size={17} /><span>설정</span></button>
    </aside>
    <main>{children}</main>
  </div>;
}
