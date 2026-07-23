import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, update, onValue, push, remove, serverTimestamp, get, child } from 'firebase/database';
import type { BattleRoom, PlayerReport, MasterInstruction } from './types';

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
  const playersRef = ref(db, `battles/${code}/players`);
  const newPlayerRef = push(playersRef);
  await set(newPlayerRef, {
    playerKey,
    playerName,
    round: 1,
    estimatedScore: 0,
    status: 'draw',
  });
  return newPlayerRef.key!;
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
