// small jest test
import { describe, expect, it } from '@jest/globals';
import { TestArtifacts } from '../../TestArtifacts';
import { FormHelper } from '../FormHelper';
import { PdfGeneratorForJest } from '../../pdf/PdfGeneratorHelperForJest';
import { MyDatabaseTestableHelper } from '../../MyDatabaseHelperInterface';

PdfGeneratorForJest.activateForJest(); // activate puppeteer for jest tests

describe('Pdf Generator Test', () => {
  //describe('dev', () => {
  it('Test pdf generation from html', async () => {
    let testForm = FormHelper.getExampleForm();
    let testFormExtractRelevantInformation = FormHelper.getExampleFormExtractRelevantInformation();
    let myDatabaseTestableHelperInterface = new MyDatabaseTestableHelper();

    let requestOptions = {
      mockImageResolution: true, // mock image resolution to avoid loading real images
      // Das Beispiel-Logo kommt aus dem Repository statt vom Server – sonst stünde im Briefkopf der graue Platzhalter.
      mockImageFilesByUrlPart: [MyDatabaseTestableHelper.getExampleOrganizationLogoMockImageFile()],
    };

    let pdfBuffer = await FormHelper.generatePdfFromForm({
      form: testForm,
      formExtractRelevantInformation: testFormExtractRelevantInformation,
      myDatabaseHelperInterface: myDatabaseTestableHelperInterface,
      formSubmission: FormHelper.getExampleFormSubmission(),
      requestOptions,
    });
    expect(pdfBuffer).toBeTruthy();
    let savePath = TestArtifacts.saveTestArtifact(pdfBuffer, 'form/pdf/' + 'example-form' + '.pdf');
    expect(true).toBeTruthy();
  });
});
