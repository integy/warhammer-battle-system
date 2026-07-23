import { useState } from 'react';
import { useBattle } from './BattleContext';
import { roomExists } from './firebase';

export function BattleLobby() {
  const { createBattle, joinBattle, players, selectPlayer, selectedPlayer } = useBattle();
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    setError('');
    try {
      await createBattle();
    } catch (e: any) {
      setError(e.message || 'Failed to create room');
    }
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!selectedPlayer) {
      setError('Please select your player');
      return;
    }
    if (!joinCode.trim() || joinCode.length !== 4) {
      setError('Please enter a 4-digit room code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const exists = await roomExists(joinCode);
      if (!exists) {
        setError('Room not found. Check the code and try again.');
        setLoading(false);
        return;
      }
      await joinBattle(joinCode, selectedPlayer.key);
    } catch (e: any) {
      setError(e.message || 'Failed to join room');
    }
    setLoading(false);
  };

  return (
    <div className="battle-lobby">
      <h2>⚔️ Warhammer Team Battle System</h2>

      <div className="lobby-section">
        <h3>Create Room (Master)</h3>
        <button className="btn primary" onClick={handleCreate} disabled={loading}>
          {loading ? 'Creating...' : 'Create New Room'}
        </button>
        <p className="hint">Creates a 4-digit code to share with players.</p>
      </div>

      <div className="lobby-divider"><span>or</span></div>

      <div className="lobby-section">
        <h3>Join Room (Player)</h3>

        <label className="input-label">Select Player</label>
        <select
          className="select"
          value={selectedPlayer?.key || ''}
          onChange={(e) => selectPlayer(e.target.value)}
        >
          <option value="" disabled>-- Choose your player --</option>
          {players.map((p) => (
            <option key={p.key} value={p.key}>{p.name}</option>
          ))}
        </select>

        <label className="input-label">Room Code</label>
        <input
          type="text"
          className="input"
          placeholder="4-digit code"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
          maxLength={4}
        />

        <button className="btn primary" onClick={handleJoin} disabled={loading}>
          {loading ? 'Joining...' : 'Join Room'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}
    </div>
  );
}
