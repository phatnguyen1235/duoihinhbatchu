import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import roomReducer from './slices/roomSlice';
import gameReducer from './slices/gameSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    room: roomReducer,
    game: gameReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
