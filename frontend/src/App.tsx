import { useTheme } from "./hooks/useTheme";
import { useStats } from "./hooks/useStats";
import { useChat } from "./hooks/useChat";
import { TopBar } from "./components/TopBar";
import { Sidebar } from "./components/Sidebar";
import { ChatArea } from "./components/ChatArea";

function App() {
  const { isDark, toggle } = useTheme();
  const { stats, files, refresh } = useStats();
  const { messages, send, sending } = useChat();

  return (
    <div className="h-screen flex flex-col bg-base-200 text-base-content">
      <TopBar isDark={isDark} onToggleTheme={toggle} onNewChat={() => window.location.reload()} />
      <div className="flex flex-1 min-h-0">
        <Sidebar stats={stats} files={files} onUploaded={() => refresh()} />
        <ChatArea messages={messages} onSend={send} sending={sending} />
      </div>
    </div>
  );
}

export default App;
