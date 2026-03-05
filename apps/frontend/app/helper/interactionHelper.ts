import { InteractionManager, Platform } from 'react-native';

export const runAfterInteractions = (task: () => any) => {
    if (Platform.OS === 'web') {
        setTimeout(task, 0);
        return { cancel: () => { } };
    }

    return (InteractionManager as any).runAfterInteractions(task);
};
