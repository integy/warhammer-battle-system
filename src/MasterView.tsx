import { useBattle } from './BattleContext';
import type { PlayerReport } from './types';
import { STATUS_LABELS, INSTRUCTIONS, INSTRUCTION_LABELS } from './types';

export function MasterView() {
  const { roomCode, room, sendInstruction, leaveBattle } = useBattle();

  const players: (PlayerReport & { firebaseKey: string })[] = room
    ? Object.entries(room.players).map(([key, p]) => ({ ...p, firebaseKey: key }))
    : [];

  const currentInstruction = room?.masterInstruction ?? null;

  return (
    <div className="battle-view master-view">
      <div className="battle-header">
        <span className="badge room">Room: {roomCode}</span>
        <span className="badge master">Master</span>
        <button className="btn btn-sm" onClick={leaveBattle}>End Session</button>
      </div>

      <div className="section">
        <h3>Send Instruction</h3>
        <div className="instruction-grid">
          {INSTRUCTIONS.map((inst) => (
            <button
              key={inst}
              className={`instruction-btn ${currentInstruction === inst ? 'active' : ''}`}
              onClick={() => sendInstruction(inst)}
            >
              {INSTRUCTION_LABELS[inst]}
              {currentInstruction === inst && <span className="mark">!</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="section">
        <h3>Players ({players.length})</h3>
        {players.length === 0 ? (
          <p className="empty-state">Waiting for players to join...</p>
        ) : (
          <div className="players-table">
            <div className="players-header">
              <span>Player</span>
              <span>Score</span>
              <span>Status</span>
            </div>
            {players.map((p) => (
              <div key={p.firebaseKey} className="players-row">
                <span className="player-name">{p.playerName}</span>
                <span className="player-score">{p.estimatedScore}/20</span>
                <span className={`player-status ${p.status}`}>
                  {STATUS_LABELS[p.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
