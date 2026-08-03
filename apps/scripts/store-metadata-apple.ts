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

export type AppleAppInfoSnapshot = {
  appInfoId: string;
  state: string | undefined;
  editable: boolean;
  ageRatingDeclarationId: string | undefined;
  ageRatingDeclaration: Record<string, unknown>;
  primaryCategoryId: string | undefined;
  secondaryCategoryId: string | undefined;
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

async function fetchAppInfos(token: string, appId: string): Promise<{ appInfos: AppleAppInfoSnapshot[]; appStoreAgeRating: string | undefined }> {
  const query = new URLSearchParams({ include: 'ageRatingDeclaration,primaryCategory,secondaryCategory' });
  const result = await ascRequest(token, 'GET', `/apps/${appId}/appInfos?${query}`);
  const included = result.included ?? [];

  let appStoreAgeRating: string | undefined;
  const appInfos = asArray(result.data).map(appInfo => {
    const ageRatingDeclarationId = relationshipId(appInfo, 'ageRatingDeclaration');
    const declaration = included.find(item => item.type === 'ageRatingDeclarations' && item.id === ageRatingDeclarationId);
    const state = (appInfo.attributes?.state ?? appInfo.attributes?.appStoreState) as string | undefined;
    appStoreAgeRating = (appInfo.attributes?.appStoreAgeRating as string | undefined) ?? appStoreAgeRating;
    return {
      appInfoId: appInfo.id,
      state,
      editable: state !== undefined && EDITABLE_APP_INFO_STATES.has(state),
      ageRatingDeclarationId,
      ageRatingDeclaration: declaration?.attributes ?? {},
      primaryCategoryId: relationshipId(appInfo, 'primaryCategory'),
      secondaryCategoryId: relationshipId(appInfo, 'secondaryCategory'),
    };
  });

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

export type ApplePushPlan = {
  current: ApplePullResult;
  targetAppInfo: AppleAppInfoSnapshot | undefined;
  ageRatingChanges: AttributeChange[];
  categoryChanges: AttributeChange[];
  contentRightsChanges: AttributeChange[];
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

  return { current, targetAppInfo, ageRatingChanges, categoryChanges, contentRightsChanges };
}

export async function applyApplePush(token: string, plan: ApplePushPlan, dryRun: boolean): Promise<boolean> {
  const { current, targetAppInfo, ageRatingChanges, categoryChanges, contentRightsChanges } = plan;
  const hasChanges = ageRatingChanges.length > 0 || categoryChanges.length > 0 || contentRightsChanges.length > 0;
  if (!hasChanges) {
    console.log('   ✅ Apple: Keine Abweichungen - nichts zu tun.');
    return false;
  }

  if ((ageRatingChanges.length > 0 || categoryChanges.length > 0) && targetAppInfo && !targetAppInfo.editable) {
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
