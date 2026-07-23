export type PlayerStatus = 'doing_well' | 'good' | 'draw' | 'losing' | 'lost';

export type MasterInstruction = 'pushing_hard' | 'push' | 'keep_score' | 'safe_points';

export const STATUSES: PlayerStatus[] = ['doing_well', 'good', 'draw', 'losing', 'lost'];

export const STATUS_LABELS: Record<PlayerStatus, string> = {
  doing_well: 'Doing Well',
  good: 'Good',
  draw: 'Draw',
  losing: 'Losing',
  lost: 'Lost',
};

export const INSTRUCTIONS: MasterInstruction[] = [
  'pushing_hard',
  'push',
  'keep_score',
  'safe_points',
];

export const INSTRUCTION_LABELS: Record<MasterInstruction, string> = {
  pushing_hard: 'Pushing Hard',
  push: 'Push',
  keep_score: 'Keep Your Score',
  safe_points: 'Safe Points',
};

export interface PlayerInfo {
  key: string;
  name: string;
}

export interface PlayerReport {
  playerKey: string;
  playerName: string;
  estimatedScore: number;
  status: PlayerStatus;
}

export interface BattleRoom {
  masterInstruction: MasterInstruction | null;
  players: Record<string, PlayerReport>;
}

export type BattleRole = 'master' | 'player' | null;
