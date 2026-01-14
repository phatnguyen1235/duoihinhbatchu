import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Player {
  id: string;
  qrCodeId: string;
  score: number;
  isReady: boolean;
}

interface Room {
  id: string;
  status: 'WAITING' | 'STARTING' | 'PLAYING' | 'FINISHED';
  maxPlayers: number;
  timeoutAt: string | null;
  startedAt: string | null;
}

interface RoomState {
  current: Room | null;
  players: Player[];
  isJoining: boolean;
  error: string | null;
}

const initialState: RoomState = {
  current: null,
  players: [],
  isJoining: false,
  error: null,
};

export const roomSlice = createSlice({
  name: 'room',
  initialState,
  reducers: {
    setRoom: (state, action: PayloadAction<Room | null>) => {
      state.current = action.payload;
      state.isJoining = false;
    },
    setPlayers: (state, action: PayloadAction<Player[]>) => {
      state.players = action.payload;
    },
    addPlayer: (state, action: PayloadAction<Player>) => {
      if (!state.players.find(p => p.id === action.payload.id)) {
        state.players.push(action.payload);
      }
    },
    removePlayer: (state, action: PayloadAction<string>) => {
      state.players = state.players.filter(p => p.id !== action.payload);
    },
    updatePlayerScore: (state, action: PayloadAction<{ playerId: string; score: number }>) => {
      const player = state.players.find(p => p.id === action.payload.playerId);
      if (player) {
        player.score = action.payload.score;
      }
    },
    setJoining: (state, action: PayloadAction<boolean>) => {
      state.isJoining = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isJoining = false;
    },
    leaveRoom: () => initialState,
  },
});

export const {
  setRoom,
  setPlayers,
  addPlayer,
  removePlayer,
  updatePlayerScore,
  setJoining,
  setError,
  leaveRoom,
} = roomSlice.actions;
export default roomSlice.reducer;
