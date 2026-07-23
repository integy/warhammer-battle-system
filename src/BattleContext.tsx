import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { BattleRoom, MasterInstruction, BattleRole, PlayerInfo } from './types';
import {
  createRoom as fbCreateRoom,
  joinRoom as fbJoinRoom,
  leaveRoom as fbLeaveRoom,
  updatePlayerReport as fbUpdateReport,
  setInstruction as fbSetInstruction,
  subscribeToRoom,
  deleteRoom,
} from './firebase';
import { loadPlayers, getPlayerByKey } from './players';

interface BattleContextType {
  role: BattleRole;
  roomCode: string | null;
  firebaseKey: string | null;
  selectedPlayer: PlayerInfo | null;
  players: PlayerInfo[];
  room: BattleRoom | null;
  createBattle: () => Promise<string>;
  joinBattle: (code: string, playerKey: string) => Promise<void>;
  selectPlayer: (playerKey: string) => void;
  reportScore: (score: number) => void;
  reportStatus: (status: string) => void;
  sendInstruction: (instruction: MasterInstruction) => void;
  leaveBattle: () => void;
}

const BattleContext = createContext<BattleContextType>(null!);

export function BattleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<BattleRole>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [firebaseKey, setFirebaseKey] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerInfo | null>(null);
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [room, setRoom] = useState<BattleRoom | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    loadPlayers().then(setPlayers).catch(console.error);
  }, []);

  useEffect(() => {
    return () => { if (unsubRef.current) unsubRef.current(); };
  }, []);

  useEffect(() => {
    if (!roomCode) return;
    if (unsubRef.current) unsubRef.current();
    const unsub = subscribeToRoom(roomCode, setRoom);
    unsubRef.current = unsub;
    return () => { unsub(); };
  }, [roomCode]);

  const createBattle = useCallback(async (): Promise<string> => {
    const code = await fbCreateRoom();
    setRoomCode(code);
    setRole('master');
    return code;
  }, []);

  const selectPlayer = useCallback((playerKey: string) => {
    const info = getPlayerByKey(playerKey, players);
    if (info) setSelectedPlayer(info);
  }, [players]);

  const joinBattle = useCallback(async (code: string, playerKey: string) => {
    const info = getPlayerByKey(playerKey, players);
    if (!info) throw new Error('Player not found');
    const key = await fbJoinRoom(code, info.key, info.name);
    setRoomCode(code);
    setFirebaseKey(key);
    setSelectedPlayer(info);
    setRole('player');
  }, [players]);

  const reportScore = useCallback((score: number) => {
    if (!roomCode || !firebaseKey) return;
    fbUpdateReport(roomCode, firebaseKey, { estimatedScore: score });
  }, [roomCode, firebaseKey]);

  const reportStatus = useCallback((status: string) => {
    if (!roomCode || !firebaseKey) return;
    fbUpdateReport(roomCode, firebaseKey, { status: status as any });
  }, [roomCode, firebaseKey]);

  const sendInstruction = useCallback((instruction: MasterInstruction) => {
    if (!roomCode) return;
    fbSetInstruction(roomCode, instruction);
  }, [roomCode]);

  const leaveBattle = useCallback(() => {
    if (roomCode && firebaseKey) fbLeaveRoom(roomCode, firebaseKey);
    if (roomCode && role === 'master') deleteRoom(roomCode);
    setRoomCode(null);
    setFirebaseKey(null);
    setRole(null);
    setRoom(null);
    setSelectedPlayer(null);
  }, [roomCode, firebaseKey, role]);

  return (
    <BattleContext.Provider value={{
      role, roomCode, firebaseKey, selectedPlayer, players, room,
      createBattle, joinBattle, selectPlayer,
      reportScore, reportStatus, sendInstruction, leaveBattle,
    }}>
      {children}
    </BattleContext.Provider>
  );
}

export function useBattle() {
  return useContext(BattleContext);
}
