import { useBattle } from './BattleContext';
import type { PlayerStatus } from './types';
import { STATUSES, STATUS_LABELS, INSTRUCTIONS, INSTRUCTION_LABELS } from './types';

export function PlayerView() {
  const {
    roomCode, selectedPlayer, reportScore, reportStatus,
    leaveBattle, room,
  } = useBattle();

  const myData = room && selectedPlayer
    ? Object.values(room.players).find(p => p.playerKey === selectedPlayer.key)
    : null;

  const currentScore = myData?.estimatedScore ?? 0;
  const currentStatus: PlayerStatus = myData?.status ?? 'draw';
  const masterInstruction = room?.masterInstruction ?? null;

  const scoreRows: number[][] = [];
  for (let i = 0; i < 21; i += 7) {
    scoreRows.push(Array.from({ length: Math.min(7, 21 - i) }, (_, j) => i + j));
  }

  return (
    <div className="battle-view player-view">
      <div className="battle-header">
        <span className="badge room">Room: {roomCode}</span>
        <span className="badge player">Player: {selectedPlayer?.name}</span>
        <button className="btn btn-sm" onClick={leaveBattle}>Leave</button>
      </div>

      <div className="section">
        <h3>Estimated Score</h3>
        <div className="score-display">
          <span className="score-number">{currentScore}</span>
          <span className="score-label">/ 20</span>
        </div>
        <div className="score-grid">
          {scoreRows.map((row, ri) => (
            <div key={ri} className="score-row">
              {row.map((n) => (
                <button
                  key={n}
                  className={`score-btn ${currentScore === n ? 'active' : ''}`}
                  onClick={() => reportScore(n)}
                >
                  {n}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h3>Game Status</h3>
        <div className="status-grid">
          {STATUSES.map((s) => (
            <button
              key={s}
              className={`status-btn ${s} ${currentStatus === s ? 'active' : ''}`}
              onClick={() => reportStatus(s)}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="section">
        <h3>📋 Master Instructions</h3>
        <div className="instructions-list">
          {INSTRUCTIONS.map((inst) => (
            <div
              key={inst}
              className={`instruction-item ${masterInstruction === inst ? 'active' : ''}`}
            >
              <span>{INSTRUCTION_LABELS[inst]}</span>
              {masterInstruction === inst && <span className="mark">!</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
