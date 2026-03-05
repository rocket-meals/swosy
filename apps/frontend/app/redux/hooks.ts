import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { RootState } from './reducer';
import { configureStore } from './store/store';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export type AppDispatch = typeof configureStore.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
