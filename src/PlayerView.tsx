import { useState } from 'react';
import { useBattle } from './BattleContext';
import type { PlayerStatus } from './types';
import { STATUSES, STATUS_LABELS, INSTRUCTIONS, INSTRUCTION_LABELS } from './types';

export function PlayerView() {
  const {
    roomCode, selectedPlayer, submitReport,
    leaveBattle, room,
  } = useBattle();

  // Local state — only sent to Firebase on CONFIRM
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState<PlayerStatus>('draw');
  const [round, setRound] = useState(1);
  const [confirmed, setConfirmed] = useState(false);

  const masterInstruction = room?.masterInstruction ?? null;

  const handleConfirm = () => {
    submitReport(round, score, status);
    setConfirmed(true);
    // Reset after 1.5s
    setTimeout(() => {
      setScore(0);
      setStatus('draw');
      setRound(1);
      setConfirmed(false);
    }, 1500);
  };

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

      {confirmed && (
        <div className="confirm-flash">✓ Submitted!</div>
      )}

      <div className="section">
        <h3>Round</h3>
        <div className="round-grid">
          {[1, 2, 3, 4, 5].map((r) => (
            <button
              key={r}
              className={`round-btn ${round === r ? 'active' : ''}`}
              onClick={() => setRound(r)}
              disabled={confirmed}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="section">
        <h3>Estimated Score</h3>
        <div className="score-display">
          <span className="score-number">{score}</span>
          <span className="score-label">/ 20</span>
        </div>
        <div className="score-grid">
          {scoreRows.map((row, ri) => (
            <div key={ri} className="score-row">
              {row.map((n) => (
                <button
                  key={n}
                  className={`score-btn ${score === n ? 'active' : ''}`}
                  onClick={() => setScore(n)}
                  disabled={confirmed}
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
              className={`status-btn ${s} ${status === s ? 'active' : ''}`}
              onClick={() => setStatus(s)}
              disabled={confirmed}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* CONFIRM button */}
      <button
        className="btn confirm-btn"
        onClick={handleConfirm}
        disabled={confirmed}
      >
        {confirmed ? 'Sent ✓' : '⏎ CONFIRM'}
      </button>

      <div className="section">
        <h3>📋 Master Instructions</h3>
        <div className="instructions-list">
          {INSTRUCTIONS.map((inst) => (
            <div
              key={inst}
              className={`instruction-item ${masterInstruction === inst ? 'active' : ''}`}
            >
              <span>
                {INSTRUCTION_LABELS[inst]}
                {masterInstruction === inst && '!'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
