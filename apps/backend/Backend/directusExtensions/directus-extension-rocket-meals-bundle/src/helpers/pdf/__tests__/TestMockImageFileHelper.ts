// Jest test: die Auswahl der lokalen Datei hinter einer Bild-URL (ohne Puppeteer)
import { describe, expect, it } from '@jest/globals';
import * as path from 'node:path';
import { MockImageFileHelper } from '../MockImageFileHelper';
import { MyDatabaseTestableHelper } from '../../MyDatabaseHelperInterface';

const EXAMPLE_LOGO_MOCK_IMAGE_FILE = MyDatabaseTestableHelper.getExampleOrganizationLogoMockImageFile();
const EXAMPLE_LOGO_ASSET_URL = `https://test.rocket-meals.de/rocket-meals/api/assets/${MyDatabaseTestableHelper.EXAMPLE_COMPANY_IMAGE_FILE_ID}?quality=100&fit=contain`;

describe('MockImageFileHelper', () => {
  it('finds the mapped file when the file id is part of the asset url', () => {
    const mockImageFile = MockImageFileHelper.findMockImageFileForUrl(EXAMPLE_LOGO_ASSET_URL, [EXAMPLE_LOGO_MOCK_IMAGE_FILE]);

    expect(mockImageFile).toBe(EXAMPLE_LOGO_MOCK_IMAGE_FILE);
  });

  it('ignores the case of the url part', () => {
    const mockImageFile = MockImageFileHelper.findMockImageFileForUrl(EXAMPLE_LOGO_ASSET_URL.toUpperCase(), [EXAMPLE_LOGO_MOCK_IMAGE_FILE]);

    expect(mockImageFile).toBe(EXAMPLE_LOGO_MOCK_IMAGE_FILE);
  });

  it('finds nothing for another image, for an empty mapping and for an empty url part', () => {
    expect(MockImageFileHelper.findMockImageFileForUrl('https://example.com/assets/another-file-id', [EXAMPLE_LOGO_MOCK_IMAGE_FILE])).toBeUndefined();
    expect(MockImageFileHelper.findMockImageFileForUrl(EXAMPLE_LOGO_ASSET_URL, [])).toBeUndefined();
    expect(MockImageFileHelper.findMockImageFileForUrl(EXAMPLE_LOGO_ASSET_URL, undefined)).toBeUndefined();
    expect(MockImageFileHelper.findMockImageFileForUrl(EXAMPLE_LOGO_ASSET_URL, [{ urlPart: '', filePath: EXAMPLE_LOGO_MOCK_IMAGE_FILE.filePath, contentType: 'image/svg+xml' }])).toBeUndefined();
  });

  it('takes the first matching mapping', () => {
    const secondMockImageFile = { ...EXAMPLE_LOGO_MOCK_IMAGE_FILE, contentType: 'image/png' };

    expect(MockImageFileHelper.findMockImageFileForUrl(EXAMPLE_LOGO_ASSET_URL, [EXAMPLE_LOGO_MOCK_IMAGE_FILE, secondMockImageFile])).toBe(EXAMPLE_LOGO_MOCK_IMAGE_FILE);
  });

  it('reads the example logo and reports a missing file instead of throwing', () => {
    const body = MockImageFileHelper.readMockImageFileBody(EXAMPLE_LOGO_MOCK_IMAGE_FILE);
    expect(body).toBeTruthy();
    expect(body?.toString('utf-8')).toContain('<svg');

    const missingFile = { ...EXAMPLE_LOGO_MOCK_IMAGE_FILE, filePath: path.join(__dirname, 'this_file_does_not_exist.svg') };
    expect(MockImageFileHelper.readMockImageFileBody(missingFile)).toBeNull();
  });
});
