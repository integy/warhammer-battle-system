import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, update, onValue, remove, serverTimestamp, get, child } from 'firebase/database';
import type { BattleRoom, PlayerReport, MasterInstruction, PlayerStatus } from './types';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export function generateRoomCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export async function createRoom(): Promise<string> {
  const code = generateRoomCode();
  await set(ref(db, `battles/${code}`), {
    masterInstruction: null,
    createdAt: serverTimestamp(),
  });
  return code;
}

export async function roomExists(code: string): Promise<boolean> {
  const snapshot = await get(child(ref(db), `battles/${code}`));
  return snapshot.exists();
}

export async function deleteRoom(code: string): Promise<void> {
  await remove(ref(db, `battles/${code}`));
}

export async function joinRoom(
  code: string,
  playerKey: string,
  playerName: string
): Promise<string> {
  const playerRef = ref(db, `battles/${code}/players/${playerKey}`);

  // Check if player already exists (e.g. re-joining after refresh)
  const existing = await get(playerRef);
  if (existing.exists()) {
    // Re-join: only update the name, preserve all game data
    await update(playerRef, { playerName });
  } else {
    // First join: initialize with defaults
    await set(playerRef, {
      playerKey,
      playerName,
      round: 1,
      estimatedScore: 0,
      status: 'draw',
      roundHistory: [],
    });
  }
  return playerKey;
}

export async function submitPlayerReport(
  code: string,
  playerKey: string,
  round: number,
  score: number,
  status: PlayerStatus
): Promise<void> {
  // Read current roundHistory
  const snapshot = await get(ref(db, `battles/${code}/players/${playerKey}`));
  const current = snapshot.val() || {};
  const roundHistory: Array<{ round: number; score: number; status: string }> = current.roundHistory || [];
  
  // Replace entry for this round, keep others
  const filtered = roundHistory.filter((r) => r.round !== round);
  filtered.push({ round, score, status });
  filtered.sort((a, b) => a.round - b.round);
  
  // Write back: current fields + history
  await update(ref(db, `battles/${code}/players/${playerKey}`), {
    round,
    estimatedScore: score,
    status,
    roundHistory: filtered,
  });
}

export async function updatePlayerReport(
  code: string,
  firebaseKey: string,
  data: Partial<Pick<PlayerReport, 'round' | 'estimatedScore' | 'status'>>
): Promise<void> {
  await update(ref(db, `battles/${code}/players/${firebaseKey}`), data as Record<string, unknown>);
}

export async function leaveRoom(code: string, firebaseKey: string): Promise<void> {
  await remove(ref(db, `battles/${code}/players/${firebaseKey}`));
}

export async function setInstruction(code: string, instruction: MasterInstruction): Promise<void> {
  await set(ref(db, `battles/${code}/masterInstruction`), instruction);
}

export function subscribeToRoom(
  code: string,
  onData: (room: BattleRoom) => void
): () => void {
  const roomRef = ref(db, `battles/${code}`);
  return onValue(roomRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      onData({
        masterInstruction: data.masterInstruction || null,
        players: data.players || {},
      });
    }
  });
}
