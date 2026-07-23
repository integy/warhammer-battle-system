import { useBattle } from './BattleContext';
import type { PlayerReport, RoundData } from './types';
import { STATUS_LABELS, STATUS_COLORS, INSTRUCTIONS, INSTRUCTION_LABELS } from './types';

// SVG team score chart: shows our team total vs opponent per round
function TeamScoreChart({ roundTotals }: {
  roundTotals: { round: number; our: number; opponent: number }[];
}) {
  const validRounds = roundTotals.filter(r => r.our > 0);
  if (validRounds.length === 0) return null;

  const W = 700, H = 220, PAD_L = 50, PAD_R = 20, PAD_T = 20, PAD_B = 30;
  const maxVal = 160;

  const pointsOur = validRounds.map((r, i) => {
    const x = PAD_L + (i * (W - PAD_L - PAD_R)) / Math.max(validRounds.length - 1, 1);
    const y = H - PAD_B - (r.our / maxVal) * (H - PAD_T - PAD_B);
    return { x, y, round: r.round, val: r.our };
  });
  const pointsOpp = validRounds.map((r, i) => {
    const x = PAD_L + (i * (W - PAD_L - PAD_R)) / Math.max(validRounds.length - 1, 1);
    const y = H - PAD_B - (r.opponent / maxVal) * (H - PAD_T - PAD_B);
    return { x, y, round: r.round, val: r.opponent };
  });

  const lineOur = pointsOur.map((p, i) => `${i === 0 ? 'M' : 'L'} ${Math.round(p.x)} ${Math.round(p.y)}`).join(' ');
  const lineOpp = pointsOpp.map((p, i) => `${i === 0 ? 'M' : 'L'} ${Math.round(p.x)} ${Math.round(p.y)}`).join(' ');

  return (
    <svg className="team-score-chart" viewBox={`0 0 ${W} ${H}`} width="100%" height={H}>
      {/* Grid */}
      {[0, 40, 80, 120, 160].map(v => {
        const y = Math.round(H - PAD_B - (v / maxVal) * (H - PAD_T - PAD_B));
        return (
          <g key={v}>
            <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke="#1a1a2e" strokeWidth="1" />
            <text x={PAD_L - 6} y={y + 3} fill="#444" fontSize="10" textAnchor="end">{v}</text>
          </g>
        );
      })}

      {/* Our line */}
      <path d={lineOur} fill="none" stroke="#e0d060" strokeWidth="2.5" strokeLinejoin="round" />
      {/* Opponent line */}
      <path d={lineOpp} fill="none" stroke="#ff6b6b" strokeWidth="2.5" strokeLinejoin="round" strokeDasharray="6,3" />

      {/* Dots and labels */}
      {pointsOur.map((p, i) => (
        <g key={`our-${i}`}>
          <circle cx={Math.round(p.x)} cy={Math.round(p.y)} r="4" fill="#e0d060" stroke="#111" strokeWidth="1" />
          <text x={Math.round(p.x)} y={Math.round(p.y) - 8} fill="#e0d060" fontSize="9" textAnchor="middle">{p.val}</text>
        </g>
      ))}
      {pointsOpp.map((p, i) => (
        <g key={`opp-${i}`}>
          <circle cx={Math.round(p.x)} cy={Math.round(p.y)} r="4" fill="#ff6b6b" stroke="#111" strokeWidth="1" />
          <text x={Math.round(p.x)} y={Math.round(p.y) + 16} fill="#ff6b6b" fontSize="9" textAnchor="middle">{p.val}</text>
        </g>
      ))}

      {/* Round labels */}
      {validRounds.map((r, i) => {
        const x = PAD_L + (i * (W - PAD_L - PAD_R)) / Math.max(validRounds.length - 1, 1);
        return (
          <text key={r.round} x={Math.round(x)} y={H - 6} fill="#555" fontSize="10" textAnchor="middle">R{r.round}</text>
        );
      })}

      {/* Legend */}
      <rect x={W - 190} y={6} width={180} height={40} rx={4} fill="#0d0d1a" opacity="0.85" />
      <line x1={W - 180} y1={18} x2={W - 160} y2={18} stroke="#e0d060" strokeWidth="2.5" />
      <text x={W - 155} y={21} fill="#e0d060" fontSize="11" fontWeight="600">我方</text>
      <line x1={W - 110} y1={18} x2={W - 90} y2={18} stroke="#ff6b6b" strokeWidth="2.5" strokeDasharray="4,2" />
      <text x={W - 85} y={21} fill="#ff6b6b" fontSize="11" fontWeight="600">對方</text>
    </svg>
  );
}

// SVG sparkline: round 1-5 score tracking
function ScoreHistoryChart({ history }: { history: RoundData[] }) {
  if (!history || history.length === 0) return null;

  const W = 240, H = 160, PAD = 20;
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

  // Team score aggregation
  const ourTotal = players.reduce((sum, p) => sum + p.estimatedScore, 0);
  const opponentTotal = Math.max(0, 160 - ourTotal);
  const roundTeamTotals = [1, 2, 3, 4, 5].map(round => {
    const roundTotal = players.reduce((sum, p) => {
      const rd = (p.roundHistory || []).find(r => r.round === round);
      return sum + (rd ? rd.score : 0);
    }, 0);
    return { round, our: roundTotal, opponent: Math.max(0, 160 - roundTotal) };
  });

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

      {/* Team Score Summary */}
      <div className="team-summary">
        <div className="team-scores">
          <div className="team-score ours">
            <span className="team-label">我方</span>
            <span className="team-value">{ourTotal}</span>
          </div>
          <div className="team-score-vs">vs</div>
          <div className="team-score theirs">
            <span className="team-label">對方 (預測)</span>
            <span className="team-value">{opponentTotal}</span>
          </div>
        </div>
        {roundTeamTotals.some(r => r.our > 0) && (
          <div className="team-chart-wrap">
            <h3>每回合走勢</h3>
            <TeamScoreChart
              roundTotals={roundTeamTotals}
            />
          </div>
        )}
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
