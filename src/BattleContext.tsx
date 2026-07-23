import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { BattleRoom, MasterInstruction, BattleRole, PlayerInfo } from './types';
import {
  createRoom as fbCreateRoom,
  joinRoom as fbJoinRoom,
  leaveRoom as fbLeaveRoom,
  submitPlayerReport as fbSubmitReport,
  setInstruction as fbSetInstruction,
  subscribeToRoom,
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
  joinAsMaster: (code: string) => Promise<void>;
  joinBattle: (code: string, playerKey: string) => Promise<void>;
  selectPlayer: (playerKey: string) => void;
  reportScore: (score: number) => void;
  reportStatus: (status: string) => void;
  reportRound: (round: number) => void;
  submitReport: (round: number, score: number, status: string) => void;
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

  const joinAsMaster = useCallback(async (code: string) => {
    setRoomCode(code);
    setRole('master');
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

  const submitReport = useCallback((round: number, score: number, status: string) => {
    if (!roomCode || !firebaseKey) return;
    fbSubmitReport(roomCode, firebaseKey, round, score, status as any);
  }, [roomCode, firebaseKey]);

  const reportScore = useCallback((score: number) => {
    submitReport(1, score, 'draw'); // fallback, should use submitReport directly
  }, [submitReport]);

  const reportStatus = useCallback((status: string) => {
    submitReport(1, 0, status); // fallback
  }, [submitReport]);

  const reportRound = useCallback((round: number) => {
    submitReport(round, 0, 'draw'); // fallback
  }, [submitReport]);

  const sendInstruction = useCallback((instruction: MasterInstruction) => {
    if (!roomCode) return;
    fbSetInstruction(roomCode, instruction);
  }, [roomCode]);

  const leaveBattle = useCallback(() => {
    if (roomCode && firebaseKey) fbLeaveRoom(roomCode, firebaseKey);
    setRoomCode(null);
    setFirebaseKey(null);
    setRole(null);
    setRoom(null);
    setSelectedPlayer(null);
  }, [roomCode, firebaseKey, role]);

  return (
    <BattleContext.Provider value={{
      role, roomCode, firebaseKey, selectedPlayer, players, room,
      createBattle, joinAsMaster, joinBattle, selectPlayer,
      reportScore, reportStatus, reportRound, submitReport, sendInstruction, leaveBattle,
    }}>
      {children}
    </BattleContext.Provider>
  );
}

export function useBattle() {
  return useContext(BattleContext);
}
