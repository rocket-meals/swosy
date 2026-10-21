/**
 * university-affiliation-endpoint – shows the logged-in user which status their university reported.
 *
 * `GET /university-affiliation` (with the user's access token) answers e.g.
 * `{ is_student: true, scoped_affiliations: ["student@uni-hannover.de", "member@uni-hannover.de"], … }`.
 * The values come from the user's last login via DFN-AAI (`university-affiliation-hook`). For
 * testing: after a deploy log in once again, before that there is nothing stored.
 *
 * Real answers are kept in `src/helpers/__tests__/fixtures/university-affiliation/`.
 *
 * `received_claims` lists which claims the login delivered. Is `eduperson_scoped_affiliation`
 * missing there, the scope was not requested (`AUTH_DFN_SCOPE`) or the university does not release it.
 */

import { defineEndpoint } from '@directus/extensions-sdk';
import { ApiContext } from '../helpers/ApiContext';
import { UniversityAffiliationHelper } from '../helpers/UniversityAffiliationHelper';

const ENDPOINT_ID = 'university-affiliation';

export default defineEndpoint({
  id: ENDPOINT_ID,
  handler: (router, apiContext: ApiContext) => {
    router.get('/', async (req: any, res: any) => {
      res.set('Cache-Control', 'no-store');
      const userId = req?.accountability?.user;
      if (!userId) {
        return res.status(401).json({ error: 'Login required.' });
      }

      try {
        const user = await apiContext
          .database('directus_users')
          .select('provider', 'external_identifier')
          .where({ id: userId })
          .first();
        const provider: string | null = user?.provider ?? null;
        const identifier: string | null = user?.external_identifier ?? null;
        const record = provider && identifier ? await UniversityAffiliationHelper.load(provider, identifier) : null;
        return res.json(UniversityAffiliationHelper.toResponse(provider, record));
      } catch (error) {
        console.error(ENDPOINT_ID + ': could not read the affiliation', error);
        return res.status(500).json({ error: 'The affiliation could not be read.' });
      }
    });
  },
});
