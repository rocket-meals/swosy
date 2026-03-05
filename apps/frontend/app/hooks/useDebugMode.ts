import { useAppSelector } from '@/redux/hooks';


const useDebugMode = () => {
        return useAppSelector((state) => state.settings.debugMode);
};

export default useDebugMode;
