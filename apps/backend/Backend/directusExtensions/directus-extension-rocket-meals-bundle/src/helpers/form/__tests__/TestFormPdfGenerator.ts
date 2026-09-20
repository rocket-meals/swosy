// small jest test
import { describe, expect, it } from '@jest/globals';
import { TestArtifacts } from '../../TestArtifacts';
import { FormHelper } from '../FormHelper';
import { PdfGeneratorForJest } from '../../pdf/PdfGeneratorHelperForJest';
import { MyDatabaseTestableHelper } from '../../MyDatabaseHelperInterface';
import { DocumentOrganizationHelper } from '../../DocumentOrganizationHelper';

PdfGeneratorForJest.activateForJest(); // activate puppeteer for jest tests

/** Derselbe Test-Helfer, nur mit dem quadratischen Beispiel-Logo im Briefkopf. */
class MyDatabaseTestableHelperWithSquareLogo extends MyDatabaseTestableHelper {
  async getDocumentOrganization() {
    return DocumentOrganizationHelper.resolveDocumentOrganization(MyDatabaseTestableHelper.getExampleAppSettingsWithSquareLogo(), this);
  }
}

async function generateExamplePdf(myDatabaseTestableHelperInterface: MyDatabaseTestableHelper, artifactName: string) {
  const requestOptions = {
    mockImageResolution: true, // mock image resolution to avoid loading real images
    // Die Beispiel-Logos kommen aus dem Repository statt vom Server – sonst stünde im Briefkopf der graue Platzhalter.
    mockImageFilesByUrlPart: [MyDatabaseTestableHelper.getExampleOrganizationLogoMockImageFile(), MyDatabaseTestableHelper.getExampleSquareOrganizationLogoMockImageFile()],
  };

  const pdfBuffer = await FormHelper.generatePdfFromForm({
    form: FormHelper.getExampleForm(),
    formExtractRelevantInformation: FormHelper.getExampleFormExtractRelevantInformation(),
    myDatabaseHelperInterface: myDatabaseTestableHelperInterface,
    formSubmission: FormHelper.getExampleFormSubmission(),
    requestOptions,
  });
  expect(pdfBuffer).toBeTruthy();
  TestArtifacts.saveTestArtifact(pdfBuffer, 'form/pdf/' + artifactName + '.pdf');
}

describe('Pdf Generator Test', () => {
  //describe('dev', () => {
  it('Test pdf generation from html', async () => {
    // Das Beispiel-Logo ist ein Wort-Bild-Zeichen im Querformat – wie bei echten Einrichtungen.
    await generateExamplePdf(new MyDatabaseTestableHelper(), 'example-form');
  });

  it('Test pdf generation with a square organization logo', async () => {
    await generateExamplePdf(new MyDatabaseTestableHelperWithSquareLogo(), 'example-form-square-logo');
  });
});
