import { useState } from 'react';
import { ArrowRight, CalendarClock, Check, CheckCircle2, Clock3, FolderKanban, Plus, Search, Sparkles, X, Zap } from 'lucide-react';
import type { AppRoute, PlannerEvent, Project, Task } from '../types';

interface Props { route: AppRoute; tasks: Task[]; allTasks: Task[]; projects: Project[]; events: PlannerEvent[]; query: string; onQueryChange: (v: string) => void; onToggleTask: (id: string) => void; onAddTask: (task: Task) => void; onNavigate: (r: AppRoute) => void }

export function HomePage(props: Props) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showNewTask, setShowNewTask] = useState(false);
  const [toast, setToast] = useState('');
  const todayTasks = props.tasks.filter((task) => task.startDate <= '2026-08-14' && task.endDate >= '2026-08-14' && ['standup', 'analysis', 'meeting-task', 'draft-review'].includes(task.id));

  if (props.route !== 'today') return <PlaceholderPage route={props.route} onBack={() => props.onNavigate('today')} />;

  const completed = props.allTasks.filter((t) => ['standup', 'analysis', 'meeting-task', 'draft-review', 'root-cause'].includes(t.id) && t.status === 'completed').length;
  return <div className="home-page">
    <header className="home-header">
      <div><p className="eyebrow">안녕하세요 <span>👋</span></p><h1>오늘도 차분하게 시작해볼까요?</h1><p className="date-line">2026년 8월 14일 금요일 · 오늘 해야 할 일을 먼저 확인해보세요.</p></div>
      <div className="header-actions"><label className="search"><Search size={18} /><input value={props.query} onChange={(e) => props.onQueryChange(e.target.value)} placeholder="일정, 업무, 프로젝트 검색" />{props.query && <button onClick={() => props.onQueryChange('')}><X size={15} /></button>}</label><button className="primary-button" onClick={() => setShowNewTask(true)}><Plus size={18} />새 작업</button></div>
    </header>

    <section className="metrics">
      <Metric icon={<CheckCircle2 />} tone="purple" label="오늘 할 일" value="5" detail={<>완료 <b>{completed}</b><span className="dot">·</span>남음 <b>{5 - completed}</b></>} />
      <Metric icon={<Zap />} tone="green" label="이번 달 완료율" value="68%" detail={<div className="mini-progress"><i style={{ width: '68%' }} /></div>} />
      <Metric icon={<Clock3 />} tone="orange" label="긴급 + 중요" value="3" detail={<>오늘 우선 처리 권장</>} />
      <Metric icon={<CalendarClock />} tone="blue" label="예정된 일정" value="4" detail={<>다음 일정 <b>15:00</b></>} />
    </section>

    <div className="dashboard-grid">
      <section className="card today-card">
        <SectionTitle title="오늘의 업무" subtitle="실제로 오늘 처리해야 하는 업무 중심" count={`${todayTasks.length}개`} />
        <div className="task-list">{todayTasks.length ? todayTasks.map((task) => <TodayTask key={task.id} task={task} project={props.projects.find((p) => p.id === task.projectId)!} onToggle={() => props.onToggleTask(task.id)} onOpen={() => setSelectedTask(task)} />) : <EmptySearch />}</div>
      </section>

      <section className="card priority-card"><SectionTitle title="우선 확인" subtitle="오늘 의사결정이 필요한 업무" count="3개" />
        <div className="priority-list">{props.tasks.filter((t) => ['root-cause', 'report', 'proposal'].includes(t.id)).map((task) => <button className="priority-item" key={task.id} onClick={() => setSelectedTask(task)}><div className="priority-head"><b>{task.title}</b><ArrowRight size={16} /></div><span className={`tag ${task.urgency === 'high' ? 'danger' : ''}`}>{task.urgency === 'high' ? '긴급 + 중요' : '중요'}</span><div className="priority-meta"><span>{task.dueLabel}</span><span>{task.progress ? `진행률 ${task.progress}%` : props.projects.find((p) => p.id === task.projectId)?.title}</span></div></button>)}</div>
      </section>

      <section className="card project-card"><SectionTitle title="진행 중 프로젝트" subtitle="이번 달 프로젝트 진척도" action={<button className="text-button" onClick={() => props.onNavigate('timeline')}>간트차트 열기 <ArrowRight size={15} /></button>} />
        <div className="project-list">{props.projects.map((project) => <button className="project-item" key={project.id} onClick={() => props.onNavigate('projects')}><div><span><i style={{ background: project.color }} />{project.title}</span><b>{project.progress}%</b></div><div className="project-progress"><i style={{ width: `${project.progress}%`, background: project.color }} /></div><small>{project.startDate.slice(5).replace('-', '.')} — {project.endDate.slice(5).replace('-', '.')}</small></button>)}</div>
      </section>

      <section className="card schedule-card"><SectionTitle title="오늘 일정" subtitle="시간이 정해진 일정과 마감" action={<button className="icon-button" onClick={() => props.onNavigate('calendar')}><ArrowRight size={17} /></button>} />
        <div className="schedule-list">{todayTasks.map((task) => <button key={task.id} className="schedule-item" onClick={() => setSelectedTask(task)}><time>{task.time}</time><i className={task.id === 'meeting-task' ? 'event' : ''} /><span>{task.title}</span><em>{task.status === 'completed' ? '완료' : props.events.some((e) => e.relatedTaskId === task.id) ? '일정' : task.urgency === 'high' ? '마감' : '업무'}</em></button>)}</div>
      </section>
    </div>

    <AICommandBar onAdd={(title) => { props.onAddTask({ id: crypto.randomUUID(), title, startDate: '2026-08-17', endDate: '2026-08-17', importance: 'medium', urgency: 'medium', progress: 0, status: 'todo', projectId: 'personal', dueLabel: '8월 17일 마감' }); setToast('새 업무가 추가되었습니다.'); }} />
    {selectedTask && <TaskDrawer task={selectedTask} project={props.projects.find((p) => p.id === selectedTask.projectId)!} onClose={() => setSelectedTask(null)} />}
    {showNewTask && <NewTaskModal onClose={() => setShowNewTask(false)} onAdd={(title) => { props.onAddTask({ id: crypto.randomUUID(), title, startDate: '2026-08-14', endDate: '2026-08-14', time: '18:00', importance: 'medium', urgency: 'medium', progress: 0, status: 'todo', projectId: 'personal' }); setShowNewTask(false); setToast('오늘 업무에 새 작업을 추가했습니다.'); }} />}
    {toast && <div className="toast"><Check size={17} />{toast}<button onClick={() => setToast('')}><X size={14} /></button></div>}
  </div>;
}

function Metric({ icon, tone, label, value, detail }: { icon: React.ReactNode; tone: string; label: string; value: string; detail: React.ReactNode }) { return <article className="metric-card"><span className={`metric-icon ${tone}`}>{icon}</span><div><p>{label}</p><strong>{value}</strong><div className="metric-detail">{detail}</div></div></article> }
function SectionTitle({ title, subtitle, count, action }: { title: string; subtitle: string; count?: string; action?: React.ReactNode }) { return <div className="section-title"><div><h2>{title}</h2><p>{subtitle}</p></div>{count ? <span className="count">{count}</span> : action}</div> }
function TodayTask({ task, project, onToggle, onOpen }: { task: Task; project: Project; onToggle: () => void; onOpen: () => void }) { const done = task.status === 'completed'; return <div className={`today-task ${done ? 'done' : ''}`}><button className="checkbox" onClick={onToggle} aria-label={`${task.title} 완료 상태 변경`}>{done && <Check size={14} />}</button><time>{task.time}</time><button className="task-content" onClick={onOpen}><b>{task.title}</b><span><i style={{ background: project.color }} />{project.title}</span></button><span className={`status-tag ${task.urgency === 'high' ? 'urgent' : ''}`}>{done ? '완료' : task.urgency === 'high' ? '긴급' : '중요'}</span></div> }
function EmptySearch() { return <div className="empty"><Search size={22} /><b>검색 결과가 없습니다</b><span>다른 검색어를 입력해보세요.</span></div> }

function AICommandBar({ onAdd }: { onAdd: (title: string) => void }) {
  const [command, setCommand] = useState(''); const [preview, setPreview] = useState(false);
  const parsedTitle = command.includes('보고서') ? '보고서 작성' : command.includes('회의') ? '팀 회의' : command.replace(/추가|다음주|월요일까지|내일|오후|\d+시/g, '').trim() || '새 업무';
  return <section className="ai-card"><div className="ai-heading"><span><Sparkles size={18} /></span><div><h2>AI 명령</h2><p>자연어로 일정과 업무를 생성하거나 변경합니다.</p></div><kbd>Ctrl K</kbd></div>
    <form className="command-input" onSubmit={(e) => { e.preventDefault(); if (command.trim()) setPreview(true); }}><input value={command} onChange={(e) => setCommand(e.target.value)} placeholder="예: 다음주 월요일까지 보고서 작성 추가" /><button disabled={!command.trim()}>미리보기 <ArrowRight size={16} /></button></form>
    {preview && <div className="ai-preview"><div className="preview-mark"><Plus size={16} /></div><div><small>다음 변경을 적용할까요?</small><b>{parsedTitle}</b><p>마감 <strong>8월 17일</strong><span>중요도 보통</span><span>시급성 보통</span></p></div><div className="preview-actions"><button onClick={() => setPreview(false)}>취소</button><button className="apply" onClick={() => { onAdd(parsedTitle); setPreview(false); setCommand(''); }}><Check size={15} />적용</button></div></div>}
  </section>;
}

function TaskDrawer({ task, project, onClose }: { task: Task; project: Project; onClose: () => void }) { return <><button className="drawer-backdrop" onClick={onClose} aria-label="닫기" /><aside className="drawer"><button className="drawer-close" onClick={onClose}><X size={20} /></button><span className="drawer-label">업무 상세</span><h2>{task.title}</h2><p className="drawer-project"><i style={{ background: project.color }} />{project.title}</p><dl><div><dt>기간</dt><dd>{task.startDate} — {task.endDate}</dd></div><div><dt>진행률</dt><dd>{task.progress}%</dd></div><div><dt>중요도</dt><dd>{task.importance === 'high' ? '높음' : '보통'}</dd></div><div><dt>시급성</dt><dd>{task.urgency === 'high' ? '높음' : '보통'}</dd></div></dl><p className="drawer-note">Phase 2부터 이 패널에서 세부 정보와 하위 업무를 편집할 수 있습니다.</p></aside></> }
function NewTaskModal({ onClose, onAdd }: { onClose: () => void; onAdd: (title: string) => void }) { const [title, setTitle] = useState(''); return <div className="modal-wrap"><button className="modal-backdrop" onClick={onClose} /><form className="modal" onSubmit={(e) => { e.preventDefault(); if (title.trim()) onAdd(title.trim()); }}><div><span className="modal-icon"><Plus size={19} /></span><h2>새 작업</h2><button type="button" onClick={onClose}><X size={19} /></button></div><label>작업 이름<input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="무엇을 해야 하나요?" /></label><p>오늘 · 개인 업무 · 우선순위 보통</p><footer><button type="button" onClick={onClose}>취소</button><button className="primary-button" disabled={!title.trim()}>작업 추가</button></footer></form></div> }
function PlaceholderPage({ route, onBack }: { route: AppRoute; onBack: () => void }) { const names: Record<AppRoute, string> = { today: '오늘', priority: '우선순위', timeline: '간트차트', calendar: '캘린더', projects: '프로젝트', inbox: '받은 작업함', completed: '완료된 작업', archive: '보관함', settings: '설정' }; return <div className="placeholder"><span><FolderKanban size={27} /></span><p>다음 단계에서 만나요</p><h1>{names[route]}</h1><p>Home의 동일한 Task · Project 데이터를 기반으로 확장될 화면입니다.</p><button className="primary-button" onClick={onBack}>오늘로 돌아가기</button></div> }
