import { useBattle } from './BattleContext';
import type { PlayerReport, RoundData } from './types';
import { STATUS_LABELS, STATUS_COLORS, INSTRUCTIONS, INSTRUCTION_LABELS } from './types';

// SVG sparkline: round 1-5 score tracking
function ScoreHistoryChart({ history }: { history: RoundData[] }) {
  if (!history || history.length === 0) return null;

  const W = 240, H = 50, PAD = 20;
  const maxScore = 20;

  // Build round lookup
  const roundMap: Record<number, RoundData> = {};
  history.forEach((h) => { roundMap[h.round] = h; });

  // Points for rounds 1-5
  const allRounds = [1, 2, 3, 4, 5];
  const points = allRounds
    .map((r, i) => {
      const entry = roundMap[r];
      if (!entry) return null;
      const x = PAD + (i * (W - 2 * PAD)) / 4;
      const y = H - PAD - (entry.score / maxScore) * (H - 2 * PAD);
      return { x, y, round: r, score: entry.score, status: entry.status };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  if (points.length === 0) return null;

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <svg className="score-chart" viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      {/* Grid lines */}
      {[0, 10, 20].map((v) => {
        const y = H - PAD - (v / maxScore) * (H - 2 * PAD);
        return (
          <g key={v}>
            <line x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="#1a1a2e" strokeWidth="1" />
            <text x={PAD - 6} y={y + 3} fill="#444" fontSize="8" textAnchor="end">{v}</text>
          </g>
        );
      })}

      {/* Line */}
      <path d={linePath} fill="none" stroke="#e0d060" strokeWidth="2" strokeLinejoin="round" />

      {/* Dots with score labels */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill={STATUS_COLORS[p.status]} stroke="#111" strokeWidth="1" />
          <text x={p.x} y={p.y - 8} fill="#888" fontSize="9" textAnchor="middle">
            {p.score}
          </text>
        </g>
      ))}

      {/* Round labels */}
      {allRounds.map((r, i) => {
        const x = PAD + (i * (W - 2 * PAD)) / 4;
        const has = !!roundMap[r];
        return (
          <text key={r} x={x} y={H - 4} fill={has ? '#777' : '#333'} fontSize="9" textAnchor="middle">
            R{r}
          </text>
        );
      })}
    </svg>
  );
}

export function MasterView() {
  const { roomCode, room, sendInstruction, leaveBattle } = useBattle();

  // Build player list sorted by name then round
  const players: (PlayerReport & { firebaseKey: string })[] = (() => {
    if (!room) return [];
    const entries = Object.entries(room.players).map(([key, p]) => ({ ...p, firebaseKey: key }));
    entries.sort((a, b) => a.playerName.localeCompare(b.playerName) || a.round - b.round);
    return entries;
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
              const history = p.roundHistory || [];
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

                  {/* Score history chart */}
                  {history.length > 0 && (
                    <div className="card-chart">
                      <ScoreHistoryChart history={history} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
