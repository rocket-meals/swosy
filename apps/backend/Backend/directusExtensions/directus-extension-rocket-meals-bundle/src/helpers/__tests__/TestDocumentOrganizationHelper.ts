// Jest test: der gemeinsame Weg von app_settings zum Briefkopf
import { describe, expect, it } from '@jest/globals';
import { DatabaseTypes } from 'repo-depkit-common';
import { DocumentOrganizationHelper } from '../DocumentOrganizationHelper';
import { MyDatabaseTestableHelper } from '../MyDatabaseHelperInterface';
import { FormPdfDocumentHelper } from '../form/FormPdfDocumentHelper';

/** Ein Helfer wie der Test-Helfer, nur ohne Einrichtung in den `app_settings`. */
class MyDatabaseHelperWithoutOrganization extends MyDatabaseTestableHelper {
  async getDocumentOrganization() {
    return DocumentOrganizationHelper.resolveDocumentOrganization({}, this);
  }
}

/** Ein Helfer ohne Einrichtung, dessen Server-Info einen Projektnamen und ein Projektlogo hat. */
class MyDatabaseHelperWithServerInfoOnly extends MyDatabaseHelperWithoutOrganization {
  public static readonly PROJECT_LOGO_FILE_ID = 'project-logo-file-id';

  async getServerInfoNoInternetTest() {
    return {
      project: {
        project_name: 'Rocket Meals',
        project_descriptor: 'Studentenwerk aus der Server-Info',
        project_color: '#D14610',
        project_logo: MyDatabaseHelperWithServerInfoOnly.PROJECT_LOGO_FILE_ID,
      },
    };
  }
}

/**
 * Der Fall des Studentenwerks Hannover: Die Server-Info kennt nur den App-Namen, der
 * `project_descriptor` ist ausdrücklich `null`, und die `app_settings` haben noch keinen
 * `company_name`.
 */
class MyDatabaseHelperWithAppNameOnly extends MyDatabaseHelperWithoutOrganization {
  async getServerInfoNoInternetTest() {
    return {
      project: {
        project_name: 'Studi|Futter',
        project_descriptor: null,
        project_color: '#D14610',
        project_logo: undefined,
      },
    };
  }
}

/** Derselbe Server, aber die Einrichtung ist in den `app_settings` gepflegt. */
class MyDatabaseHelperWithCompanyNameAndServerInfo extends MyDatabaseHelperWithServerInfoOnly {
  async getDocumentOrganization() {
    return DocumentOrganizationHelper.resolveDocumentOrganization({ company_name: 'Studentenwerk Hannover' }, this);
  }
}

describe('DocumentOrganizationHelper', () => {
  it('resolves the logo of the example app_settings as an asset url instead of a data uri', async () => {
    const myDatabaseTestableHelper = new MyDatabaseTestableHelper();

    const organization = await myDatabaseTestableHelper.getDocumentOrganization();

    expect(organization.name).toBe(MyDatabaseTestableHelper.EXAMPLE_ORGANIZATION_NAME);
    expect(organization.logoUrl).toContain(`${myDatabaseTestableHelper.getServerUrl()}/assets/${MyDatabaseTestableHelper.EXAMPLE_COMPANY_IMAGE_FILE_ID}`);
    expect(organization.logoUrl?.startsWith('data:')).toBe(false);
  });

  it('resolves company_image given as a file object the same way as a file id', () => {
    const myDatabaseTestableHelper = new MyDatabaseTestableHelper();
    const companyImage = { id: MyDatabaseTestableHelper.EXAMPLE_COMPANY_IMAGE_FILE_ID } as unknown as DatabaseTypes.DirectusFiles;

    const organization = DocumentOrganizationHelper.resolveDocumentOrganization({ company_name: 'Studentenwerk Musterstadt', company_image: companyImage }, myDatabaseTestableHelper);

    expect(organization.logoUrl).toContain(`/assets/${MyDatabaseTestableHelper.EXAMPLE_COMPANY_IMAGE_FILE_ID}`);
  });

  it('leaves name and logo empty when the app_settings have neither', () => {
    const organization = DocumentOrganizationHelper.resolveDocumentOrganization({ company_name: null, company_image: null }, new MyDatabaseTestableHelper());

    expect(organization).toEqual({ name: null, logoUrl: null });
  });

  it('falls back to the server info when the app_settings have no organization', async () => {
    const organization = await FormPdfDocumentHelper.resolveOrganization(new MyDatabaseHelperWithServerInfoOnly());

    expect(organization.name).toBe('Studentenwerk aus der Server-Info');
    expect(organization.logoUrl).toContain(`/assets/${MyDatabaseHelperWithServerInfoOnly.PROJECT_LOGO_FILE_ID}`);
  });

  it('never puts the app name on the document, not even when nothing else is left', async () => {
    // `project_name` ist der Name der App, nicht der Einrichtung – ein Abnahmeprotokoll trägt ihn
    // nicht. Bleibt sonst nichts übrig, trägt das Dokument eben keinen Namen.
    const organization = await FormPdfDocumentHelper.resolveOrganization(new MyDatabaseHelperWithAppNameOnly());

    expect(organization.name).toBeNull();
    expect(organization.logoUrl).toBeNull();
  });

  it('never puts the app name on the document even when the server info has no descriptor field at all', async () => {
    const organization = await FormPdfDocumentHelper.resolveOrganization(new MyDatabaseHelperWithoutOrganization());

    expect(organization.name).toBeNull();
    expect(organization.logoUrl).toBeNull();
  });

  it('prefers the company name of the app_settings over the descriptor of the server info', async () => {
    const organization = await FormPdfDocumentHelper.resolveOrganization(new MyDatabaseHelperWithCompanyNameAndServerInfo());

    expect(organization.name).toBe('Studentenwerk Hannover');
    // Ohne `company_image` bleibt es beim Projektlogo – nur der Name kommt aus den `app_settings`.
    expect(organization.logoUrl).toContain(`/assets/${MyDatabaseHelperWithServerInfoOnly.PROJECT_LOGO_FILE_ID}`);
  });
});
