import type { AppleAppMetadata } from 'repo-depkit-common';
import { JsonApiResource, asArray, ascRequest, findAppId } from './asc-api';
import { AttributeChange, changesToAttributeObject, computeAttributeChanges, formatChanges } from './store-metadata-diff';

// Reads and writes the "App-Informationen" (age rating declaration, categories, content
// rights) of an app in App Store Connect. Only fields that are set in the ground truth
// are managed - see packages/common/src/StoreAppMetadata.ts.

// https://developer.apple.com/documentation/appstoreconnectapi/appinfo - the age rating
// declaration and the categories hang off the "editable" AppInfo. Apple creates one as
// soon as a new app store version draft exists.
const EDITABLE_APP_INFO_STATES = new Set(['PREPARE_FOR_SUBMISSION', 'DEVELOPER_REJECTED', 'REJECTED', 'METADATA_REJECTED', 'WAITING_FOR_REVIEW']);

export type AppleAppInfoLocalizationSnapshot = {
  localizationId: string;
  locale: string | undefined;
  privacyPolicyUrl: string | undefined;
  privacyChoicesUrl: string | undefined;
};

export type AppleAppInfoSnapshot = {
  appInfoId: string;
  state: string | undefined;
  editable: boolean;
  ageRatingDeclarationId: string | undefined;
  ageRatingDeclaration: Record<string, unknown>;
  primaryCategoryId: string | undefined;
  secondaryCategoryId: string | undefined;
  localizations: AppleAppInfoLocalizationSnapshot[];
};

export type ApplePullResult = {
  appId: string;
  bundleId: string;
  name: string | undefined;
  contentRightsDeclaration: string | undefined;
  appStoreAgeRating: string | undefined;
  appInfos: AppleAppInfoSnapshot[];
};

function relationshipId(resource: JsonApiResource, relationship: string): string | undefined {
  return resource.relationships?.[relationship]?.data?.id;
}

async function fetchAppInfoLocalizations(token: string, appInfoId: string): Promise<AppleAppInfoLocalizationSnapshot[]> {
  const result = await ascRequest(token, 'GET', `/appInfos/${appInfoId}/appInfoLocalizations`);
  return asArray(result.data).map(localization => ({
    localizationId: localization.id,
    locale: localization.attributes?.locale as string | undefined,
    privacyPolicyUrl: localization.attributes?.privacyPolicyUrl as string | undefined,
    privacyChoicesUrl: localization.attributes?.privacyChoicesUrl as string | undefined,
  }));
}

async function fetchAppInfos(token: string, appId: string): Promise<{ appInfos: AppleAppInfoSnapshot[]; appStoreAgeRating: string | undefined }> {
  const query = new URLSearchParams({ include: 'ageRatingDeclaration,primaryCategory,secondaryCategory' });
  const result = await ascRequest(token, 'GET', `/apps/${appId}/appInfos?${query}`);
  const included = result.included ?? [];

  let appStoreAgeRating: string | undefined;
  const appInfos: AppleAppInfoSnapshot[] = [];
  for (const appInfo of asArray(result.data)) {
    const ageRatingDeclarationId = relationshipId(appInfo, 'ageRatingDeclaration');
    const declaration = included.find(item => item.type === 'ageRatingDeclarations' && item.id === ageRatingDeclarationId);
    const state = (appInfo.attributes?.state ?? appInfo.attributes?.appStoreState) as string | undefined;
    appStoreAgeRating = (appInfo.attributes?.appStoreAgeRating as string | undefined) ?? appStoreAgeRating;
    appInfos.push({
      appInfoId: appInfo.id,
      state,
      editable: state !== undefined && EDITABLE_APP_INFO_STATES.has(state),
      ageRatingDeclarationId,
      ageRatingDeclaration: declaration?.attributes ?? {},
      primaryCategoryId: relationshipId(appInfo, 'primaryCategory'),
      secondaryCategoryId: relationshipId(appInfo, 'secondaryCategory'),
      localizations: await fetchAppInfoLocalizations(token, appInfo.id),
    });
  }

  return { appInfos, appStoreAgeRating };
}

export async function pullAppleMetadata(token: string, metadata: AppleAppMetadata): Promise<ApplePullResult> {
  const appId = await findAppId(token, metadata.bundleId);
  const appResult = await ascRequest(token, 'GET', `/apps/${appId}`);
  const app = asArray(appResult.data)[0];
  const { appInfos, appStoreAgeRating } = await fetchAppInfos(token, appId);

  return {
    appId,
    bundleId: metadata.bundleId,
    name: app?.attributes?.name as string | undefined,
    contentRightsDeclaration: app?.attributes?.contentRightsDeclaration as string | undefined,
    appStoreAgeRating,
    appInfos,
  };
}

export type AppleLocalizationChanges = {
  localizationId: string;
  locale: string | undefined;
  changes: AttributeChange[];
};

export type ApplePushPlan = {
  current: ApplePullResult;
  targetAppInfo: AppleAppInfoSnapshot | undefined;
  ageRatingChanges: AttributeChange[];
  categoryChanges: AttributeChange[];
  contentRightsChanges: AttributeChange[];
  localizationChanges: AppleLocalizationChanges[];
};

export function planApplePush(current: ApplePullResult, metadata: AppleAppMetadata): ApplePushPlan {
  // Prefer the editable AppInfo; a read-only one is still useful to show the diff.
  const targetAppInfo = current.appInfos.find(info => info.editable) ?? current.appInfos[0];

  const ageRatingChanges = metadata.ageRatingDeclaration && targetAppInfo ? computeAttributeChanges(metadata.ageRatingDeclaration, targetAppInfo.ageRatingDeclaration) : [];

  const categoryChanges = targetAppInfo
    ? computeAttributeChanges(
        { primaryCategoryId: metadata.primaryCategoryId, secondaryCategoryId: metadata.secondaryCategoryId },
        { primaryCategoryId: targetAppInfo.primaryCategoryId, secondaryCategoryId: targetAppInfo.secondaryCategoryId }
      )
    : [];

  const contentRightsChanges = computeAttributeChanges({ contentRightsDeclaration: metadata.contentRightsDeclaration }, { contentRightsDeclaration: current.contentRightsDeclaration });

  // The privacy urls apply to every locale of the app's "App-Informationen".
  const localizationChanges: AppleLocalizationChanges[] = [];
  for (const localization of targetAppInfo?.localizations ?? []) {
    const changes = computeAttributeChanges(
      { privacyPolicyUrl: metadata.privacyPolicyUrl, privacyChoicesUrl: metadata.privacyChoicesUrl },
      { privacyPolicyUrl: localization.privacyPolicyUrl, privacyChoicesUrl: localization.privacyChoicesUrl }
    );
    if (changes.length > 0) {
      localizationChanges.push({ localizationId: localization.localizationId, locale: localization.locale, changes });
    }
  }

  return { current, targetAppInfo, ageRatingChanges, categoryChanges, contentRightsChanges, localizationChanges };
}

export async function applyApplePush(token: string, plan: ApplePushPlan, dryRun: boolean): Promise<boolean> {
  const { current, targetAppInfo, ageRatingChanges, categoryChanges, contentRightsChanges, localizationChanges } = plan;
  const hasChanges = ageRatingChanges.length > 0 || categoryChanges.length > 0 || contentRightsChanges.length > 0 || localizationChanges.length > 0;
  if (!hasChanges) {
    console.log('   ✅ Apple: Keine Abweichungen - nichts zu tun.');
    return false;
  }

  if ((ageRatingChanges.length > 0 || categoryChanges.length > 0 || localizationChanges.length > 0) && targetAppInfo && !targetAppInfo.editable) {
    throw new Error(
      `Apple: Es gibt Abweichungen, aber keine bearbeitbare AppInfo (Status: ${targetAppInfo.state}). ` +
        'Altersfreigabe und Kategorien sind nur änderbar, solange eine App-Store-Version im Entwurfsstatus existiert. ' +
        'Bitte zuerst eine neue Version anlegen (macht der Submit-Workflow automatisch) und dann erneut pushen.'
    );
  }

  if (ageRatingChanges.length > 0 && targetAppInfo) {
    console.log(`   📝 Apple Altersfreigabe (${ageRatingChanges.length} Änderungen):\n${formatChanges(ageRatingChanges, '      ')}`);
    if (!targetAppInfo.ageRatingDeclarationId) {
      throw new Error('Apple: AppInfo hat keine ageRatingDeclaration-Relationship - bitte in App Store Connect prüfen.');
    }
    if (!dryRun) {
      await ascRequest(token, 'PATCH', `/ageRatingDeclarations/${targetAppInfo.ageRatingDeclarationId}`, {
        data: {
          type: 'ageRatingDeclarations',
          id: targetAppInfo.ageRatingDeclarationId,
          attributes: changesToAttributeObject(ageRatingChanges),
        },
      });
    }
  }

  if (categoryChanges.length > 0 && targetAppInfo) {
    console.log(`   📝 Apple Kategorien:\n${formatChanges(categoryChanges, '      ')}`);
    if (!dryRun) {
      const relationships: Record<string, { data: { type: string; id: string } | null }> = {};
      for (const change of categoryChanges) {
        const relationship = change.key === 'primaryCategoryId' ? 'primaryCategory' : 'secondaryCategory';
        relationships[relationship] = { data: change.to ? { type: 'appCategories', id: String(change.to) } : null };
      }
      await ascRequest(token, 'PATCH', `/appInfos/${targetAppInfo.appInfoId}`, {
        data: { type: 'appInfos', id: targetAppInfo.appInfoId, relationships },
      });
    }
  }

  for (const { localizationId, locale, changes } of localizationChanges) {
    console.log(`   📝 Apple App-Informationen (${locale}):\n${formatChanges(changes, '      ')}`);
    if (!dryRun) {
      await ascRequest(token, 'PATCH', `/appInfoLocalizations/${localizationId}`, {
        data: { type: 'appInfoLocalizations', id: localizationId, attributes: changesToAttributeObject(changes) },
      });
    }
  }

  if (contentRightsChanges.length > 0) {
    console.log(`   📝 Apple Content Rights:\n${formatChanges(contentRightsChanges, '      ')}`);
    if (!dryRun) {
      await ascRequest(token, 'PATCH', `/apps/${current.appId}`, {
        data: { type: 'apps', id: current.appId, attributes: changesToAttributeObject(contentRightsChanges) },
      });
    }
  }

  console.log(dryRun ? '   🔍 Apple: Dry-Run - nichts geschrieben.' : '   ✅ Apple: Änderungen übertragen.');
  return true;
}
