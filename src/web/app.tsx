import { useBlogStore } from './store/blogStore';
import { AgentSidebar } from './components/AgentSidebar';
import { Welcome } from './pages/Welcome';
import { Agent1 } from './pages/Agent1';
import { Agent2 } from './pages/Agent2';
import { Agent3 } from './pages/Agent3';
import { Agent4 } from './pages/Agent4';
import { Agent5 } from './pages/Agent5';
import { Agent6 } from './pages/Agent6';
import { Agent7 } from './pages/Agent7';
import { Agent8 } from './pages/Agent8';
import { Agent9 } from './pages/Agent9';
import { Agent10 } from './pages/Agent10';

const AGENT_PAGES: Record<number, React.ComponentType> = {
  1: Agent1, 2: Agent2, 3: Agent3, 4: Agent4, 5: Agent5,
  6: Agent6, 7: Agent7, 8: Agent8, 9: Agent9, 10: Agent10,
};

export function App() {
  const { currentAgent } = useBlogStore();
  const ActivePage = currentAgent > 0 ? AGENT_PAGES[currentAgent] : null;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <AgentSidebar />
      <main className="flex-1 overflow-y-auto">
        {ActivePage ? <ActivePage /> : <Welcome />}
      </main>
    </div>
  );
}
