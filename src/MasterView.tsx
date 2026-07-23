import { useBattle } from './BattleContext';
import type { PlayerReport } from './types';
import { STATUS_LABELS, STATUS_COLORS, INSTRUCTIONS, INSTRUCTION_LABELS } from './types';

export function MasterView() {
  const { roomCode, room, sendInstruction, leaveBattle } = useBattle();

  // Dedup: group by (playerName, round), keep newest (higher Firebase key = later)
  const players: (PlayerReport & { firebaseKey: string })[] = (() => {
    if (!room) return [];
    const entries = Object.entries(room.players).map(([key, p]) => ({ ...p, firebaseKey: key }));
    // Sort by firebaseKey descending (newest first)
    entries.sort((a, b) => b.firebaseKey.localeCompare(a.firebaseKey));
    const seen = new Set<string>();
    const deduped: (PlayerReport & { firebaseKey: string })[] = [];
    for (const p of entries) {
      const groupKey = `${p.playerName}|${p.round}`;
      if (!seen.has(groupKey)) {
        seen.add(groupKey);
        deduped.push(p);
      }
    }
    // Sort back by player name then round for display
    deduped.sort((a, b) => a.playerName.localeCompare(b.playerName) || a.round - b.round);
    return deduped;
  })();

  const currentInstruction = room?.masterInstruction ?? null;

  return (
    <div className="battle-view master-view">
      {/* Big Room Header */}
      <div className="master-header">
        <div className="room-display">
          <span className="room-label">ROOM</span>
          <span className="room-number">{roomCode}</span>
        </div>
        <span className="badge master">Master</span>
        <button className="btn btn-sm" onClick={leaveBattle}>End Session</button>
      </div>

      {/* Instruction Controls */}
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
              {currentInstruction === inst && '!'}
            </button>
          ))}
        </div>
      </div>

      {/* Battlefield Overview */}
      <div className="section">
        <h3>Battlefield ({players.length} players)</h3>
        {players.length === 0 ? (
          <p className="empty-state">Waiting for players to join...</p>
        ) : (
          <div className="battlefield">
            {players.map((p) => {
              const pct = Math.round((p.estimatedScore / 20) * 100);
              const statusColor = STATUS_COLORS[p.status];
              return (
                <div key={p.firebaseKey} className="player-card">
                  <div className="card-top">
                    <span className="card-name">{p.playerName}</span>
                    <span className="card-round">R{p.round}</span>
                  </div>

                  {/* Score bar */}
                  <div className="card-score">
                    <span className="card-score-num">{p.estimatedScore}</span>
                    <span className="card-score-max">/20</span>
                  </div>
                  <div className="score-bar-track">
                    <div
                      className="score-bar-fill"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {/* Status dot */}
                  <div className="card-status">
                    <span
                      className="status-dot"
                      style={{ background: statusColor }}
                    />
                    <span style={{ color: statusColor }}>
                      {STATUS_LABELS[p.status]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
