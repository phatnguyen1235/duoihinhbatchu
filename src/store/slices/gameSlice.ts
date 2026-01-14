import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface GameState {
  currentQuestion: {
    id: string;
    imageUrl: string;
    hint?: string;
  } | null;
  userAnswer: string;
  isCorrect: boolean | null;
  correctAnswer: string | null;
  isSubmitting: boolean;
  timeRemaining: number;
  questionTime: number;
  scoreGained: number;
}

const initialState: GameState = {
  currentQuestion: null,
  userAnswer: '',
  isCorrect: null,
  correctAnswer: null,
  isSubmitting: false,
  timeRemaining: 30,
  questionTime: 30,
  scoreGained: 0,
};

export const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setQuestion: (state, action: PayloadAction<GameState['currentQuestion']>) => {
      state.currentQuestion = action.payload;
      state.userAnswer = '';
      state.isCorrect = null;
      state.correctAnswer = null;
      state.timeRemaining = state.questionTime;
    },
    setQuestionTime: (state, action: PayloadAction<number>) => {
      state.questionTime = action.payload;
      state.timeRemaining = action.payload;
    },
    setUserAnswer: (state, action: PayloadAction<string>) => {
      state.userAnswer = action.payload;
    },
    setSubmitting: (state, action: PayloadAction<boolean>) => {
      state.isSubmitting = action.payload;
    },
    setResult: (state, action: PayloadAction<{ isCorrect: boolean; correctAnswer?: string; scoreGained: number }>) => {
      state.isCorrect = action.payload.isCorrect;
      state.correctAnswer = action.payload.correctAnswer || null;
      state.scoreGained = action.payload.scoreGained;
      state.isSubmitting = false;
    },
    decrementTime: (state) => {
      if (state.timeRemaining > 0) state.timeRemaining--;
    },
    resetGame: () => initialState,
  },
});

export const {
  setQuestion,
  setQuestionTime,
  setUserAnswer,
  setSubmitting,
  setResult,
  decrementTime,
  resetGame,
} = gameSlice.actions;
export default gameSlice.reducer;
