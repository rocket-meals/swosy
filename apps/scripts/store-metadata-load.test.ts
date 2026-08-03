import { filterStoreMetadata, loadStoreMetadataModule } from './store-metadata-load';

// Loads the real ground-truth modules of all apps to catch broken imports or missing
// exports before a sync run in CI would.
describe('loadStoreMetadataModule', () => {
  it('loads the rocket-meals tenant ground truth', () => {
    const metadata = loadStoreMetadataModule('apps/frontend/app/store-metadata.ts');
    const bundleIds = metadata.map(entry => entry.apple?.bundleId);
    expect(bundleIds).toContain('de.baumgartner-software.swosy');
    expect(bundleIds).toContain('de.stwh.app');
    for (const entry of metadata) {
      expect(entry.apple?.ageRatingDeclaration?.gambling).toBe(false);
      // Documented deviation from the defaults, see docs/Apple Altersfreigabe.txt
      expect(entry.apple?.ageRatingDeclaration?.alcoholTobaccoOrDrugUseOrReferences).toBe('INFREQUENT_OR_MILD');
      expect(entry.apple?.primaryCategoryId).toBe('FOOD_AND_DRINK');
    }
  });

  it('loads the geonexia ground truth', () => {
    const metadata = loadStoreMetadataModule('apps/geonexia/frontend/store-metadata.ts');
    expect(metadata[0].apple?.bundleId).toBe('de.baumgartner-software.geonexia');
    expect(metadata[0].google?.packageName).toBe('com.geonexia.app');
  });

  it('loads the score-tracker ground truth', () => {
    const metadata = loadStoreMetadataModule('apps/score-tracker/frontend/store-metadata.ts');
    expect(metadata[0].apple?.bundleId).toBe('de.baumgartner-software.score-tracker');
    expect(metadata[0].google?.packageName).toBe('com.scoretracker.app');
  });

  it('throws for unknown modules', () => {
    expect(() => loadStoreMetadataModule('apps/does-not-exist/store-metadata.ts')).toThrow('nicht gefunden');
  });
});

describe('filterStoreMetadata', () => {
  const metadata = loadStoreMetadataModule('apps/frontend/app/store-metadata.ts');

  it('filters by bundle id, package name and display name', () => {
    expect(filterStoreMetadata(metadata, 'de.stwh.app')).toHaveLength(1);
    expect(filterStoreMetadata(metadata, 'swosy').length).toBeGreaterThanOrEqual(1);
  });

  it('returns everything without a filter', () => {
    expect(filterStoreMetadata(metadata, undefined)).toHaveLength(metadata.length);
  });

  it('throws when nothing matches', () => {
    expect(() => filterStoreMetadata(metadata, 'no-such-app')).toThrow('Kein App-Eintrag');
  });
});
