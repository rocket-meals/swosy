import { useMemo } from 'react';
import { useAppSelector } from '@/redux/hooks';

import { UserHelper } from '@/helper/UserHelper';
import { GuestAccountHelper } from 'repo-depkit-common';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';

const useLogoutButtonTranslation = () => {
        const { translate } = useLanguage();
        const { user } = useAppSelector((state) => state.authReducer);
        const isRegisteredUser = UserHelper.isRegisteredUser(user);
        // A guest can't come back after logging out, so for guests "log out" deletes the account.
        const isGuestUser = isRegisteredUser && GuestAccountHelper.isGuestEmail(user?.email);

        const buttonLabel = useMemo(() => {
                if (isGuestUser) return translate(TranslationKeys.guest_account_delete);
                return translate(isRegisteredUser ? TranslationKeys.logout : TranslationKeys.sign_in);
        }, [isGuestUser, isRegisteredUser, translate]);

        const modalDescription = useMemo(
                () => translate(isGuestUser ? TranslationKeys.guest_account_delete_description : TranslationKeys.logout_flow_modal_description),
                [isGuestUser, translate]
        );

        return { buttonLabel, modalDescription, isRegisteredUser, isGuestUser };
};

export default useLogoutButtonTranslation;
