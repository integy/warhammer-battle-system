import type { PlayerInfo } from './types';

let cachedPlayers: PlayerInfo[] | null = null;

export async function loadPlayers(): Promise<PlayerInfo[]> {
  if (cachedPlayers) return cachedPlayers as PlayerInfo[];
  const res = await fetch('/players.json');
  if (!res.ok) throw new Error('Failed to load player list');
  const data = await res.json();
  cachedPlayers = data.players;
  return cachedPlayers!;
}

export function getPlayerByKey(key: string, players: PlayerInfo[]): PlayerInfo | undefined {
  return players.find(p => p.key === key);
}
