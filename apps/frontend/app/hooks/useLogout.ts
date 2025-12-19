import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter } from 'expo-router';

import { performLogout } from '@/helper/logoutHelper';

const useLogout = () => {
        const dispatch = useDispatch();
        const router = useRouter();

        return useCallback(
                async (asGuest: boolean = false) => {
                        await performLogout(dispatch, router, asGuest);
                },
                [dispatch, router]
        );
};

export default useLogout;
