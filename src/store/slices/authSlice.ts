import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  qrCodeId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  qrCodeId: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (state, action: PayloadAction<{ qrCodeId: string }>) => {
      state.qrCodeId = action.payload.qrCodeId;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    logout: (state) => {
      state.qrCodeId = null;
      state.isAuthenticated = false;
      state.error = null;
    },
  },
});

export const { setAuth, setLoading, setError, logout } = authSlice.actions;
export default authSlice.reducer;
