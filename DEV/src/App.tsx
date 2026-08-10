import { useMemo, useState } from 'react';
import { initialEvents, initialProjects, initialTasks } from './data/mockRepository';
import { AppShell } from './components/AppShell';
import { HomePage } from './components/HomePage';
import type { AppRoute, Task } from './types';

export default function App() {
  const [route, setRoute] = useState<AppRoute>('today');
  const [tasks, setTasks] = useState(initialTasks);
  const [query, setQuery] = useState('');

  const filteredTasks = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('ko');
    if (!needle) return tasks;
    return tasks.filter((task) => {
      const project = initialProjects.find((item) => item.id === task.projectId);
      return `${task.title} ${project?.title ?? ''}`.toLocaleLowerCase('ko').includes(needle);
    });
  }, [query, tasks]);

  const toggleTask = (id: string) => setTasks((items) => items.map((task) => task.id === id
    ? { ...task, status: task.status === 'completed' ? 'todo' : 'completed', progress: task.status === 'completed' ? 0 : 100 } as Task
    : task));

  const addTask = (task: Task) => setTasks((items) => [...items, task]);

  return (
    <AppShell route={route} onNavigate={setRoute} projects={initialProjects}>
      <HomePage
        route={route}
        tasks={filteredTasks}
        allTasks={tasks}
        projects={initialProjects}
        events={initialEvents}
        query={query}
        onQueryChange={setQuery}
        onToggleTask={toggleTask}
        onAddTask={addTask}
        onNavigate={setRoute}
      />
    </AppShell>
  );
}
