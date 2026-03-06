// small jest test
import { describe, expect, it } from '@jest/globals';
import { TestArtifacts } from '../../TestArtifacts';
import { FormHelper } from '../FormHelper';
import { PdfGeneratorForJest } from '../../pdf/PdfGeneratorHelperForJest';
import { MyDatabaseTestableHelper } from '../../MyDatabaseHelperInterface';
import * as fs from 'fs';
import * as path from 'path';

PdfGeneratorForJest.activateForJest(); // activate puppeteer for jest tests

describe('Pdf Generator Test', () => {
//describe('dev', () => {
  it('Test pdf generation from html', async () => {
    let testForm = FormHelper.getExampleForm();

    const signaturePngPath = path.join(__dirname, 'data', 'signature_handwritten_example.png');
    const signaturePngBuffer = fs.readFileSync(signaturePngPath);
    const signatureDataUri = `data:image/png;base64,${signaturePngBuffer.toString('base64')}`;

    let testFormExtractRelevantInformation = FormHelper.getExampleFormExtractRelevantInformation(signatureDataUri);
    let myDatabaseTestableHelperInterface = new MyDatabaseTestableHelper();

    let requestOptions = {
      mockImageResolution: true, // mock image resolution to avoid loading real images
    };

    let pdfBuffer = await FormHelper.generatePdfFromForm({
      form: testForm,
      formExtractRelevantInformation: testFormExtractRelevantInformation,
      myDatabaseHelperInterface: myDatabaseTestableHelperInterface,
      requestOptions,
    });
    expect(pdfBuffer).toBeTruthy();
    let savePath = TestArtifacts.saveTestArtifact(pdfBuffer, 'form/pdf/' + 'example-form' + '.pdf');
    expect(true).toBeTruthy();
  });
});
