import { configureStore, combineReducers } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';

// Create a root reducer with a reset ability
const appReducer = combineReducers({
  auth: authReducer,
  // Add other reducers here as needed
});

// Root reducer with state reset capability
const rootReducer = (state: any, action: any) => {
  // Reset all state when logout action is dispatched
  if (action.type === 'auth/logout/fulfilled') {
    state = undefined;
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore certain action types for non-serializable warnings
        ignoredActions: ['auth/login/fulfilled'],
      },
    }),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 