// Jest test: der gemeinsame Weg von app_settings zum Briefkopf
import { describe, expect, it } from '@jest/globals';
import { DatabaseTypes } from 'repo-depkit-common';
import { DocumentOrganizationHelper } from '../DocumentOrganizationHelper';
import { MyDatabaseTestableHelper } from '../MyDatabaseHelperInterface';
import { FormPdfDocumentHelper } from '../form/FormPdfDocumentHelper';

/** Ein Helfer wie der Test-Helfer, nur ohne Logo in den `app_settings`. */
class MyDatabaseHelperWithoutOrganization extends MyDatabaseTestableHelper {
  async getDocumentOrganization() {
    return DocumentOrganizationHelper.resolveDocumentOrganization({}, this);
  }
}

/** Ein Helfer ohne Logo in den `app_settings`, dessen Server-Info Beschreibung und Logo hat. */
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
 * `project_descriptor` ist ausdrücklich `null`, und die `app_settings` haben kein Logo.
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

/** Ein Server ganz ohne Namen – weder Beschreibung noch Projektname. */
class MyDatabaseHelperWithoutAnyName extends MyDatabaseHelperWithoutOrganization {
  async getServerInfoNoInternetTest() {
    return {
      project: {
        project_name: '',
        project_descriptor: null,
        project_color: '#D14610',
        project_logo: undefined,
      },
    };
  }
}

/** Derselbe Server, aber das Logo der Einrichtung ist in den `app_settings` gepflegt. */
class MyDatabaseHelperWithCompanyImageAndServerInfo extends MyDatabaseHelperWithServerInfoOnly {
  async getDocumentOrganization() {
    return DocumentOrganizationHelper.resolveDocumentOrganization({ company_image: MyDatabaseTestableHelper.EXAMPLE_COMPANY_IMAGE_FILE_ID }, this);
  }
}

describe('DocumentOrganizationHelper', () => {
  it('resolves the logo of the example app_settings as an asset url instead of a data uri', async () => {
    const myDatabaseTestableHelper = new MyDatabaseTestableHelper();

    const organization = await myDatabaseTestableHelper.getDocumentOrganization();

    expect(organization.logoUrl).toContain(`${myDatabaseTestableHelper.getServerUrl()}/assets/${MyDatabaseTestableHelper.EXAMPLE_COMPANY_IMAGE_FILE_ID}`);
    expect(organization.logoUrl?.startsWith('data:')).toBe(false);
  });

  it('resolves company_image given as a file object the same way as a file id', () => {
    const myDatabaseTestableHelper = new MyDatabaseTestableHelper();
    const companyImage = { id: MyDatabaseTestableHelper.EXAMPLE_COMPANY_IMAGE_FILE_ID } as unknown as DatabaseTypes.DirectusFiles;

    const organization = DocumentOrganizationHelper.resolveDocumentOrganization({ company_image: companyImage }, myDatabaseTestableHelper);

    expect(organization.logoUrl).toContain(`/assets/${MyDatabaseTestableHelper.EXAMPLE_COMPANY_IMAGE_FILE_ID}`);
  });

  it('leaves the logo empty when the app_settings have none', () => {
    const organization = DocumentOrganizationHelper.resolveDocumentOrganization({ company_image: null }, new MyDatabaseTestableHelper());

    expect(organization).toEqual({ logoUrl: null });
  });

  it('takes the name from the descriptor of the server info and falls back to the project logo', async () => {
    const organization = await FormPdfDocumentHelper.resolveOrganization(new MyDatabaseHelperWithServerInfoOnly());

    expect(organization.name).toBe('Studentenwerk aus der Server-Info');
    expect(organization.logoUrl).toContain(`/assets/${MyDatabaseHelperWithServerInfoOnly.PROJECT_LOGO_FILE_ID}`);
  });

  it('falls back to the app name when the server info has no descriptor', async () => {
    // Der Name steht nur in der Fußzeile, nicht im Briefkopf – dort ist der App-Name die
    // ehrlichere Angabe als gar keine: Er sagt, womit das Dokument erzeugt wurde.
    const organization = await FormPdfDocumentHelper.resolveOrganization(new MyDatabaseHelperWithAppNameOnly());

    expect(organization.name).toBe('Studi|Futter');
    expect(organization.logoUrl).toBeNull();
  });

  it('leaves the name empty when the server info has neither descriptor nor project name', async () => {
    const organization = await FormPdfDocumentHelper.resolveOrganization(new MyDatabaseHelperWithoutAnyName());

    expect(organization.name).toBeNull();
    expect(organization.logoUrl).toBeNull();
  });

  it('prefers the company image of the app_settings over the logo of the server info', async () => {
    const organization = await FormPdfDocumentHelper.resolveOrganization(new MyDatabaseHelperWithCompanyImageAndServerInfo());

    expect(organization.logoUrl).toContain(`/assets/${MyDatabaseTestableHelper.EXAMPLE_COMPANY_IMAGE_FILE_ID}`);
    // Der Name bleibt der der Server-Info – die `app_settings` steuern nur das Logo bei.
    expect(organization.name).toBe('Studentenwerk aus der Server-Info');
  });
});
