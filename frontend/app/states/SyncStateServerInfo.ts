import {ServerInfo} from '@/helper/database/server/ServerAPI';
import {PersistentStore} from '@/helper/syncState/PersistentStore';
import {useIsDemo} from '@/states/SynchedDemo';
import {useSynchedResourceSingleRaw} from '@/states/SynchedResource';

export function useServerInfoRaw() {
	return useSynchedResourceSingleRaw<ServerInfo>(PersistentStore.server_info);
}

export function useServerInfo() {
	const [serverInfo, setServerInfo] = useServerInfoRaw();
	const isDemoMode = useIsDemo()

	return isDemoMode ? {
		status: 'cached',
		info: {
			project: {
				project_name: 'Rocket Meals',
				project_descriptor: 'Your company',
				default_language: 'de-DE',
				project_logo: null,
				project_color: '#D14610',
				public_foreground: null,
				public_background: null,
				public_note: null,
				custom_css: null,
			}
		},
	} : serverInfo;
}

export function useServerStatus() {
	const serverInfo = useServerInfo();
	return serverInfo?.status;
}

export function useIsServerOnline() {
	const status = useServerStatus();
	return status === 'online'
}

export function useIsServerCached() {
	const status = useServerStatus();
	return status === 'cached'
}

export function useIsServerOffline() {
	const status = useServerStatus();
	return status === 'offline' || status === 'error' || status === undefined
}