import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

export function useDebugMode(): boolean {
	return useSelector((state: RootState) => state.hexTiles.isDebugMode);
}
