import { createState } from '../StateManager';

export const request = <T>(asyncFunction: () => Promise<T>) => {
  const state = createState<{ loading: boolean; data: null | T; error: any }>({
    loading: true,
    data: null,
    error: null,
  });
  asyncFunction().then(
    (data) => {
      state.loading = false;
      state.data = data;
    },
    (error) => {
      state.loading = false;
      state.error = error;
    },
  );
  return state;
};
