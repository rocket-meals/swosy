// Jest test: Briefkopf und Fußzeile nennen die Einrichtung genau einmal
import { describe, expect, it } from '@jest/globals';
import { FormDocument } from '../FormPdfDocumentHelper';
import { FormHelper } from '../FormHelper';
import { HtmlGenerator, HtmlTemplatesEnum } from '../../html/HtmlGenerator';
import { MyDatabaseTestableHelper } from '../../MyDatabaseHelperInterface';
import { FormExtractRelevantInformation } from '../../../forms-sync-hook';

const LOGO_URL = 'https://test.rocket-meals.de/rocket-meals/api/assets/1e6a0c8e-4b2d-4c7a-9a4f-0b1d2e3f4a5b';
const ORGANIZATION_NAME = 'Studentenwerk Musterstadt';
const DOCUMENT_TITLE = 'Übergabeprotokoll';

/** Ein Dokument, von dem nur der Briefkopf interessiert – alles andere bleibt leer. */
function buildFormDocument(organizationName: string | null, organizationLogoUrl: string | null): FormDocument {
  return {
    documentTitle: DOCUMENT_TITLE,
    documentSubtitle: 'Protokoll über die Rückgabe des Wohnraums.',
    organizationName: organizationName,
    organizationLogoUrl: organizationLogoUrl,
    metaEntries: [],
    sections: [],
    signatures: [],
    attachments: [],
    attachmentsTitle: 'Anlagen',
    placeAndDateLabel: 'Ort, Datum',
    placeAndDateValue: '27.11.2023',
  };
}

/**
 * Nur das Markup des Briefkopfs, ohne den `<style>`-Block: Die Klassennamen stehen auch in den
 * Regeln, ein Test gegen das ganze Dokument würde sie dort finden und nie etwas beweisen.
 */
async function renderLetterheadMarkup(formDocument: FormDocument): Promise<string> {
  const html = await HtmlGenerator.generateHtml({ ...formDocument }, new MyDatabaseTestableHelper(), HtmlTemplatesEnum.FORM_DOCUMENT);
  const headerMatch = /<header class="doc-header">([\s\S]*?)<\/header>/.exec(html);
  return headerMatch?.[1] ?? '';
}

/** Der Teil der Fußzeile, der Aussteller und Formular nennt. */
function renderFooterDocumentText(formDocument: FormDocument): string {
  const footer = FormHelper.getPdfFooterTemplate(formDocument, [] as unknown as FormExtractRelevantInformation);
  const documentTextMatch = /text-overflow:ellipsis;">([\s\S]*?)<\/span>/.exec(footer);
  return documentTextMatch?.[1] ?? '';
}

describe('Briefkopf des Formular-PDFs', () => {
  it('setzt den Namen der Einrichtung nicht noch einmal unter ihr Logo', async () => {
    // Das Logo einer Einrichtung ist üblicherweise ein Wort-Bild-Zeichen: Der Name steht schon
    // darin. Eine zusätzliche Textzeile würde ihn ein zweites Mal zeigen.
    const headerMarkup = await renderLetterheadMarkup(buildFormDocument(ORGANIZATION_NAME, LOGO_URL));

    expect(headerMarkup).toContain('class="doc-header__logo"');
    expect(headerMarkup).not.toContain('doc-header__organization-name');
    // Beim Kopieren aus dem PDF und für Screenreader bleibt der Name über das `alt` erhalten.
    expect(headerMarkup).toContain(`alt="${ORGANIZATION_NAME}"`);
  });

  it('setzt den Namen der Einrichtung als Textzeile, wenn es kein Logo gibt', async () => {
    const headerMarkup = await renderLetterheadMarkup(buildFormDocument(ORGANIZATION_NAME, null));

    expect(headerMarkup).not.toContain('doc-header__logo');
    expect(headerMarkup).toContain('class="doc-header__organization-name"');
    expect(headerMarkup).toContain(ORGANIZATION_NAME);
  });

  it('lässt den Block der Einrichtung ganz weg, wenn es weder Logo noch Namen gibt', async () => {
    const headerMarkup = await renderLetterheadMarkup(buildFormDocument(null, null));

    expect(headerMarkup).not.toContain('doc-header__organization');
    expect(headerMarkup).toContain(DOCUMENT_TITLE);
  });
});

describe('Fußzeile des Formular-PDFs', () => {
  it('nennt Einrichtung und Formular, durch einen Mittelpunkt getrennt', () => {
    expect(renderFooterDocumentText(buildFormDocument(ORGANIZATION_NAME, LOGO_URL))).toBe(`${ORGANIZATION_NAME} &middot; ${DOCUMENT_TITLE}`);
  });

  it('zeigt ohne Einrichtung nur den Formulartitel, ohne einsames Trennzeichen', () => {
    expect(renderFooterDocumentText(buildFormDocument(null, LOGO_URL))).toBe(DOCUMENT_TITLE);
  });

  it('behandelt einen Namen aus lauter Leerzeichen wie keinen Namen', () => {
    expect(renderFooterDocumentText(buildFormDocument('   ', LOGO_URL))).toBe(DOCUMENT_TITLE);
  });
});
