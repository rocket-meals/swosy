import type { AppleAppMetadata, GooglePlayAppMetadata } from 'repo-depkit-common';
import { ApplePullResult, planApplePush } from './store-metadata-apple';
import { GooglePullResult, planGooglePush } from './store-metadata-google';

describe('planApplePush', () => {
  const current: ApplePullResult = {
    appId: 'app-1',
    bundleId: 'de.example.app',
    name: 'Example',
    contentRightsDeclaration: undefined,
    appStoreAgeRating: 'FOUR_PLUS',
    appInfos: [
      {
        appInfoId: 'info-readonly',
        state: 'READY_FOR_DISTRIBUTION',
        editable: false,
        ageRatingDeclarationId: 'age-1',
        ageRatingDeclaration: { gambling: false, violenceCartoonOrFantasy: 'NONE' },
        primaryCategoryId: 'FOOD_AND_DRINK',
        secondaryCategoryId: undefined,
        localizations: [],
      },
      {
        appInfoId: 'info-editable',
        state: 'PREPARE_FOR_SUBMISSION',
        editable: true,
        ageRatingDeclarationId: 'age-2',
        ageRatingDeclaration: { gambling: true, violenceCartoonOrFantasy: 'NONE' },
        primaryCategoryId: 'EDUCATION',
        secondaryCategoryId: undefined,
        localizations: [
          { localizationId: 'loc-de', locale: 'de-DE', privacyPolicyUrl: 'https://old.example.com/datenschutz', privacyChoicesUrl: undefined },
          { localizationId: 'loc-en', locale: 'en-US', privacyPolicyUrl: undefined, privacyChoicesUrl: undefined },
        ],
      },
    ],
  };

  it('prefers the editable app info and only reports drifted fields', () => {
    const metadata: AppleAppMetadata = {
      bundleId: 'de.example.app',
      ageRatingDeclaration: { gambling: false, violenceCartoonOrFantasy: 'NONE' },
      primaryCategoryId: 'FOOD_AND_DRINK',
    };
    const plan = planApplePush(current, metadata);
    expect(plan.targetAppInfo?.appInfoId).toBe('info-editable');
    expect(plan.ageRatingChanges).toEqual([{ key: 'gambling', from: true, to: false }]);
    expect(plan.categoryChanges).toEqual([{ key: 'primaryCategoryId', from: 'EDUCATION', to: 'FOOD_AND_DRINK' }]);
    expect(plan.contentRightsChanges).toEqual([]);
  });

  it('manages nothing when the ground truth defines nothing', () => {
    const plan = planApplePush(current, { bundleId: 'de.example.app' });
    expect(plan.ageRatingChanges).toEqual([]);
    expect(plan.categoryChanges).toEqual([]);
    expect(plan.contentRightsChanges).toEqual([]);
    expect(plan.localizationChanges).toEqual([]);
  });

  it('updates the privacy policy url for every locale that differs', () => {
    const plan = planApplePush(current, { bundleId: 'de.example.app', privacyPolicyUrl: 'https://new.example.com/datenschutz' });
    expect(plan.localizationChanges).toEqual([
      { localizationId: 'loc-de', locale: 'de-DE', changes: [{ key: 'privacyPolicyUrl', from: 'https://old.example.com/datenschutz', to: 'https://new.example.com/datenschutz' }] },
      { localizationId: 'loc-en', locale: 'en-US', changes: [{ key: 'privacyPolicyUrl', from: undefined, to: 'https://new.example.com/datenschutz' }] },
    ]);
  });
});

describe('planGooglePush', () => {
  const current: GooglePullResult = {
    packageName: 'de.example.app',
    details: { defaultLanguage: 'de-DE', contactEmail: 'old@example.com' },
    listings: [{ language: 'de-DE', title: 'Alter Titel', shortDescription: 'Kurz' }],
  };

  it('reports drifted details and listings', () => {
    const metadata: GooglePlayAppMetadata = {
      packageName: 'de.example.app',
      contactEmail: 'new@example.com',
      listings: { 'de-DE': { title: 'Neuer Titel' } },
    };
    const plan = planGooglePush(current, metadata);
    expect(plan.detailsChanges).toEqual([{ key: 'contactEmail', from: 'old@example.com', to: 'new@example.com' }]);
    expect(plan.listingChanges).toEqual([{ language: 'de-DE', changes: [{ key: 'title', from: 'Alter Titel', to: 'Neuer Titel' }] }]);
  });

  it('is empty when store and ground truth match', () => {
    const metadata: GooglePlayAppMetadata = {
      packageName: 'de.example.app',
      defaultLanguage: 'de-DE',
      listings: { 'de-DE': { title: 'Alter Titel' } },
    };
    const plan = planGooglePush(current, metadata);
    expect(plan.detailsChanges).toEqual([]);
    expect(plan.listingChanges).toEqual([]);
  });
});
