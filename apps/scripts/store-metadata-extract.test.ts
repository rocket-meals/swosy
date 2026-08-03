import { extractGroundTruthSnippet } from './store-metadata-extract';

describe('extractGroundTruthSnippet', () => {
  it('turns a pulled snapshot into a paste-ready ground truth block', () => {
    const snippet = extractGroundTruthSnippet({
      bundleId: 'de.example.app',
      contentRightsDeclaration: 'DOES_NOT_USE_THIRD_PARTY_CONTENT',
      appInfos: [
        {
          state: 'READY_FOR_DISTRIBUTION',
          editable: false,
          ageRatingDeclaration: { gambling: true },
        },
        {
          state: 'PREPARE_FOR_SUBMISSION',
          editable: true,
          ageRatingDeclaration: {
            violenceCartoonOrFantasy: 'NONE',
            alcoholTobaccoOrDrugUseOrReferences: 'INFREQUENT_OR_MILD',
            gambling: false,
            inAppControls: null,
          },
          primaryCategoryId: 'FOOD_AND_DRINK',
          localizations: [
            { locale: 'de-DE', privacyPolicyUrl: 'https://rocket-meals.de/rocket-meals/wikis?custom_id=privacy-policy' },
            { locale: 'en-US', privacyPolicyUrl: 'https://rocket-meals.de/rocket-meals/wikis?custom_id=privacy-policy' },
          ],
        },
      ],
    });

    expect(snippet).toContain("alcoholTobaccoOrDrugUseOrReferences: 'INFREQUENT_OR_MILD',");
    expect(snippet).toContain('gambling: false,');
    // Answered fields sorted alphabetically, unanswered ones marked as comment
    expect(snippet).toContain('// inAppControls: null, // ❗ in App Store Connect unbeantwortet');
    expect(snippet).toContain("primaryCategoryId: 'FOOD_AND_DRINK',");
    expect(snippet).toContain("contentRightsDeclaration: 'DOES_NOT_USE_THIRD_PARTY_CONTENT',");
    // Identical urls across locales collapse into a single line
    expect(snippet.match(/privacyPolicyUrl/g)).toHaveLength(1);
    // Values from the read-only app info must not leak in
    expect(snippet).not.toContain('gambling: true');
  });

  it('throws for snapshots without app infos', () => {
    expect(() => extractGroundTruthSnippet({})).toThrow('keine appInfos');
  });
});
