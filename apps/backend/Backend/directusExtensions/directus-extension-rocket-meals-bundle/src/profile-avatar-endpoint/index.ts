/**
 * profile-avatar-endpoint – the avatar of a profile as SVG image.
 *
 * `GET /profile-avatar/<profileId>?size=64` answers with the DiceBear SVG drawn from
 * `profiles.avatar`, exactly like the app draws it (same helper `AvatarSvg` from
 * `repo-depkit-common-ui`). 404 when the profile has no avatar.
 *
 * Why an endpoint and not drawing in the browser: the DiceBear styles are about 2 MB of JavaScript.
 * Bundled into the app part of this extension they would load with every page of the Directus app,
 * not only with the page "Live-Puls" that shows the avatars. As `<img>` the browser also caches them.
 *
 * Read with the permissions of the requester: whoever may not read `profiles.avatar` gets an error.
 *
 * `GET /profile-avatar/silhouette?size=64&color=6644ff` draws the default avatar for profiles without
 * an avatar and nickname of their own (`getSilhouetteAvatarConfig`): the same avatar style, all in one
 * color. It reads nothing from the database, any invalid color gives black.
 */

import { defineEndpoint } from '@directus/extensions-sdk';
import { Accountability } from '@directus/types';
import { CollectionNames, DatabaseTypes } from 'repo-depkit-common';
import { createAvatarSvg, parseAvatarConfig } from 'repo-depkit-common-ui/src/components/MyAvatar/AvatarSvg';
import { getSilhouetteAvatarConfig } from 'repo-depkit-common-ui/src/components/MyAvatar/SilhouetteAvatar';
import { ApiContext } from '../helpers/ApiContext';

const ENDPOINT_ID = 'profile-avatar';

const DEFAULT_SIZE = 64;
const MIN_SIZE = 16;
const MAX_SIZE = 256;

/** Avatars change rarely and the URL of the module page carries a version – a few minutes are fine. */
const CACHE_CONTROL = 'private, max-age=600';
/** The silhouette only depends on its URL. */
const SILHOUETTE_CACHE_CONTROL = 'public, max-age=86400';

/**
 * DiceBear escapes option values, so no stored text ends up as markup. Opened directly in the
 * browser an SVG could still run scripts in the origin of Directus – this policy forbids that anyway.
 */
const CONTENT_SECURITY_POLICY = "default-src 'none'; style-src 'unsafe-inline'";

function parseSize(value: unknown): number {
  const size = typeof value === 'string' ? Number.parseInt(value, 10) : Number.NaN;
  if (Number.isNaN(size)) {
    return DEFAULT_SIZE;
  }
  return Math.min(MAX_SIZE, Math.max(MIN_SIZE, size));
}

function sendSvg(res: any, svg: string, cacheControl: string) {
  res.set('Content-Type', 'image/svg+xml; charset=utf-8');
  res.set('Cache-Control', cacheControl);
  res.set('Content-Security-Policy', CONTENT_SECURITY_POLICY);
  res.set('X-Content-Type-Options', 'nosniff');
  return res.send(svg);
}

export default defineEndpoint({
  id: ENDPOINT_ID,
  handler: (router, apiContext: ApiContext) => {
    // Before `/:profileId`, else "silhouette" would be read as a profile id.
    router.get('/silhouette', (req: any, res: any) => {
      const size = parseSize(req.query?.size);
      const color = typeof req.query?.color === 'string' ? req.query.color : undefined;
      const svg = createAvatarSvg({ config: { ...getSilhouetteAvatarConfig(color), size }, size });
      return sendSvg(res, svg, SILHOUETTE_CACHE_CONTROL);
    });

    router.get('/:profileId', async (req: any, res: any) => {
      const profileId = typeof req.params?.profileId === 'string' ? req.params.profileId.trim() : '';
      if (!profileId) {
        return res.status(400).json({ error: 'The profile id is required.' });
      }

      try {
        const { ItemsService } = apiContext.services;
        const profilesService = new ItemsService(CollectionNames.PROFILES, {
          accountability: (req?.accountability as Accountability | undefined) ?? null,
          knex: apiContext.database,
          schema: await apiContext.getSchema(),
        });
        const profile = (await profilesService.readOne(profileId, { fields: ['id', 'avatar'] })) as Pick<DatabaseTypes.Profiles, 'id' | 'avatar'>;
        const config = parseAvatarConfig(profile?.avatar);
        if (!config) {
          return res.status(404).json({ error: 'The profile has no avatar.' });
        }
        const size = parseSize(req.query?.size);
        const svg = createAvatarSvg({ config: { ...config, size }, size });
        return sendSvg(res, svg, CACHE_CONTROL);
      } catch (error: any) {
        // Forbidden or not existing look the same in Directus – both end up here.
        const status = Number(error?.status) || 403;
        return res.status(status).json({ error: 'The avatar could not be read.' });
      }
    });
  },
});
