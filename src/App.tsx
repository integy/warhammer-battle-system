import { BattleProvider, useBattle } from './BattleContext';
import { BattleLobby } from './BattleLobby';
import { MasterView } from './MasterView';
import { PlayerView } from './PlayerView';
import './App.css';

function AppContent() {
  const { role } = useBattle();

  return (
    <div className="app">
      {!role && <BattleLobby />}
      {role === 'master' && <MasterView />}
      {role === 'player' && <PlayerView />}
    </div>
  );
}

export default function App() {
  return (
    <BattleProvider>
      <AppContent />
    </BattleProvider>
  );
}
