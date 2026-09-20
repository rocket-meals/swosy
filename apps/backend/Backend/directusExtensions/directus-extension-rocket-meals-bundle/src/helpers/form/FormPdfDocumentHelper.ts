/**
 * FormPdfDocumentHelper.ts – baut aus einem ausgefüllten Formular das Datenmodell für
 * `templates/form-document.liquid`.
 *
 * Bis hierher hat das Backend die HTML-Struktur des PDFs selbst zusammengesetzt. Das Aussehen
 * eines gedruckten Formulars – Beschriftungsspalte, Schreiblinie, Ankreuzfelder, IBAN-Kästchen –
 * lässt sich so kaum pflegen. Deshalb liefert dieser Helper nur noch **Inhalt**: Abschnitte,
 * Zeilen, Unterschriften, Anhänge. Wie das gesetzt wird, entscheidet das Liquid-Template.
 *
 * Zwei Konventionen bestimmen die Struktur:
 * - **Abschnitte** entstehen aus dem Alias der Felder. Stehen mehrere Felder mit demselben
 *   Präfix vor dem Doppelpunkt direkt hintereinander (`Mieter: Vorname`, `Mieter: Nachname`),
 *   werden sie zu einem Abschnitt „Mieter" mit den Beschriftungen „Vorname", „Nachname"
 *   zusammengefasst. Die Reihenfolge der Felder bleibt dabei unangetastet – ein Protokoll ist
 *   ein Dokument, dessen Reihenfolge der Formularautor festgelegt hat.
 * - **Leere Felder verschwinden nicht.** Ein Formular zeigt auch die Zeilen, die niemand
 *   ausgefüllt hat; nur so ist dem Leser klar, dass nichts fehlt, sondern nichts eingetragen
 *   wurde. Ausgenommen sind Bilder: ein leerer Bildrahmen sagt nichts.
 */

import { FormExtractFormAnswerValueFileSingle, FormExtractFormAnswerValueFileSingleOrString, FormExtractRelevantInformation, FormExtractRelevantInformationSingle } from '../../forms-sync-hook';
import { ContentTranslationHelper, ExistingTranslation } from '../ContentTranslationHelper';
import { DirectusFilesAssetHelper } from '../DirectusFilesAssetHelper';
import { MyDatabaseTestableHelperInterface } from '../MyDatabaseHelperInterface';
import { BackendTranslationKeys, BackendTranslator } from '../translations';
import { DatabaseTypes, DateHelper, FormHelperCommon, NumberHelper, StringHelper } from 'repo-depkit-common';
import { EnvVariableHelper } from '../EnvVariableHelper';

export type FormGenerationParams = {
  form: DatabaseTypes.Forms;
  formExtractRelevantInformation: FormExtractRelevantInformation;
  myDatabaseHelperInterface: MyDatabaseTestableHelperInterface;
  /**
   * Der Vorgang, zu dem die Antworten gehören – optional, weil Tests und Vorschauen ein
   * Formular ohne Einreichung setzen. Daraus entstehen Vorgangskennung und Eingangsdatum
   * im Kopf des Dokuments.
   */
  formSubmission?: DatabaseTypes.FormSubmissions;
};

/** Welche Darstellung eine Formularzeile im Template bekommt. */
export type FormDocumentRowType = 'text' | 'multiline' | 'boolean' | 'character_boxes';

/** Eine Option eines Ankreuzfeldes, z. B. „Ja" oder „Nein". */
export type FormDocumentCheckboxOption = {
  label: string;
  checked: boolean;
};

export type FormDocumentRow = {
  type: FormDocumentRowType;
  label: string;
  /**
   * Der Kleingedruckte Hinweis unter der Beschriftung, aus `form_fields.translations.description`
   * – auf dem Papiervordruck steht dort z. B. „(nur, wenn abweichend von bisheriger Nummer)".
   */
  hint: string | null;
  /** Der Wert als reiner Text; leer, wenn das Feld nicht ausgefüllt wurde. */
  text: string;
  /** Nur bei `boolean`: die Optionen in Anzeigereihenfolge. */
  options?: FormDocumentCheckboxOption[];
  /** Nur bei `character_boxes`: Zeichen in Vierergruppen, wie auf Papierformularen. */
  boxGroups?: string[][];
};

export type FormDocumentSection = {
  /** `null`, wenn die Zeilen zu keinem gemeinsamen Abschnitt gehören. */
  title: string | null;
  rows: FormDocumentRow[];
};

export type FormDocumentSignature = {
  label: string;
  /** `null`, wenn nicht unterschrieben wurde – die Linie wird trotzdem gedruckt. */
  imageUrl: string | null;
};

export type FormDocumentAttachment = {
  label: string;
  imageUrl: string;
};

/** Eine Zeile des Vorgangsblocks unter dem Titel, z. B. „Vorgang: 2024-000188". */
export type FormDocumentMetaEntry = {
  label: string;
  value: string;
};

export type FormDocument = {
  documentTitle: string;
  documentSubtitle: string | null;
  /** Name der herausgebenden Einrichtung im Briefkopf – nicht der Name der App. */
  organizationName: string | null;
  /** Logo der Einrichtung im Briefkopf. */
  organizationLogoUrl: string | null;
  /** Vorgangskennung und Eingangsdatum; leer, wenn keine Einreichung bekannt ist. */
  metaEntries: FormDocumentMetaEntry[];
  sections: FormDocumentSection[];
  signatures: FormDocumentSignature[];
  attachments: FormDocumentAttachment[];
  attachmentsTitle: string;
  /** Beschriftung der Zeile „Ort, Datum" über den Unterschriften. */
  placeAndDateLabel: string;
  /**
   * Das Datum in dieser Zeile – das Eingangsdatum des Vorgangs. Der Ort bleibt leer: welcher
   * Ort dort gehört, weiß nur, wer unterschreibt.
   */
  placeAndDateValue: string;
};

/** Ein Feld mit aufgeteilter Beschriftung, bevor daraus Abschnitte werden. */
type LabelledRow = {
  groupTitle: string | null;
  labelWithoutGroup: string;
  fullLabel: string;
  row: FormDocumentRow;
};

export class FormPdfDocumentHelper {
  private static readonly IMAGE_TRANSFORM_OPTIONS = DirectusFilesAssetHelper.PRESET_FILE_TRANSFORMATION_IMAGE_HD;
  private static readonly SIGNATURE_TRANSFORM_OPTIONS = DirectusFilesAssetHelper.PRESET_FILE_TRANSFORMATION_IMAGE_ORIGINAL;

  /** Trennzeichen, an dem der Alias eines Feldes in Abschnitt und Beschriftung zerfällt. */
  private static readonly GROUP_SEPARATOR = ':';

  /** Kästchen pro Gruppe – so sind IBANs auf Papierformularen gesetzt. */
  public static readonly CHARACTER_BOX_GROUP_SIZE = 4;

  /** Wie viele leere Kästchen gedruckt werden, wenn nichts eingetragen wurde. */
  private static readonly EMPTY_BOX_COUNT_IBAN = 22;
  private static readonly EMPTY_BOX_COUNT_BIC = 11;

  // ── Dokument ──────────────────────────────────────────────────────────────

  public static async buildFormDocument(params: FormGenerationParams): Promise<FormDocument> {
    const { form, formExtractRelevantInformation, myDatabaseHelperInterface, formSubmission } = params;

    const labelledRows: LabelledRow[] = [];
    const signatures: FormDocumentSignature[] = [];
    const attachments: FormDocumentAttachment[] = [];

    for (const formExtract of formExtractRelevantInformation) {
      const label = this.getFieldLabel(formExtract);
      const hint = this.getFieldHint(formExtract);
      const fieldType = formExtract.form_field.field_type ?? '';

      if (fieldType === FormHelperCommon.FORM_FIELD_TYPE.FILES_IMAGE_SIGNATURE) {
        signatures.push({
          label,
          imageUrl: this.resolveImageUrl(formExtract.form_answer.value_image, myDatabaseHelperInterface, true),
        });
        continue;
      }

      const attachmentsOfField = this.buildAttachmentsForField(label, formExtract, myDatabaseHelperInterface);
      if (attachmentsOfField.length > 0) {
        attachments.push(...attachmentsOfField);
        continue;
      }

      const row = this.buildRowForField(label, hint, formExtract);
      if (row) {
        labelledRows.push(this.splitLabelIntoGroupAndLabel(row));
      }
    }

    const organization = await this.resolveOrganization(myDatabaseHelperInterface);

    return {
      documentTitle: this.getDocumentTitle(form),
      documentSubtitle: this.getContentTranslation(form.translations, 'description'),
      organizationName: organization.name,
      organizationLogoUrl: organization.logoUrl,
      metaEntries: this.buildMetaEntries(formSubmission),
      sections: this.buildSections(labelledRows),
      signatures,
      attachments,
      attachmentsTitle: BackendTranslator.translate(BackendTranslationKeys.form_pdf_attachments),
      placeAndDateLabel: BackendTranslator.translate(BackendTranslationKeys.form_pdf_place_and_date),
      placeAndDateValue: this.formatSubmissionDate(formSubmission),
    };
  }

  /**
   * Der Titel des Dokuments: der übersetzte Name des Formulars, sonst sein Alias.
   *
   * Auch die Fußzeile zeigt diesen Namen, deshalb ist die Ableitung öffentlich.
   */
  public static getDocumentTitle(form: DatabaseTypes.Forms): string {
    return this.getContentTranslation(form.translations, 'name') || form.alias || form.id;
  }

  /**
   * Name und Logo der herausgebenden Einrichtung, mit den Rückfällen der Directus-Server-Info.
   *
   * `app_settings.company_name` ist der Name der Einrichtung; `project_descriptor` und
   * `project_name` sind nur der App-Name und deshalb bloß die letzte Notlösung, damit der
   * Briefkopf nie leer bleibt.
   */
  private static async resolveOrganization(myDatabaseHelperInterface: MyDatabaseTestableHelperInterface): Promise<{ name: string | null; logoUrl: string | null }> {
    const organization = await myDatabaseHelperInterface.getDocumentOrganization();
    const serverInfo = await myDatabaseHelperInterface.getServerInfo();

    const name = organization.name || serverInfo?.project?.project_descriptor || serverInfo?.project?.project_name || null;

    let logoUrl = organization.logoUrl;
    const projectLogoAssetId = serverInfo?.project?.project_logo;
    if (!logoUrl && projectLogoAssetId) {
      logoUrl = DirectusFilesAssetHelper.getDirectAssetUrlById(projectLogoAssetId, myDatabaseHelperInterface, this.SIGNATURE_TRANSFORM_OPTIONS);
    }

    return { name: name, logoUrl: logoUrl ?? null };
  }

  // ── Vorgangsdaten ─────────────────────────────────────────────────────────

  /** Vorgangskennung und Eingangsdatum – beides nur, wenn die Einreichung es hergibt. */
  private static buildMetaEntries(formSubmission: DatabaseTypes.FormSubmissions | null | undefined): FormDocumentMetaEntry[] {
    if (!formSubmission) {
      return [];
    }

    const metaEntries: FormDocumentMetaEntry[] = [];
    const reference = formSubmission.alias || formSubmission.id;
    if (reference) {
      metaEntries.push({ label: BackendTranslator.translate(BackendTranslationKeys.form_pdf_reference), value: reference });
    }

    const receivedAt = this.formatSubmissionDate(formSubmission);
    if (receivedAt) {
      metaEntries.push({ label: BackendTranslator.translate(BackendTranslationKeys.form_pdf_received_at), value: receivedAt });
    }

    return metaEntries;
  }

  /** Das Eingangsdatum der Einreichung als deutsches Datum; leer, wenn es keins gibt. */
  private static formatSubmissionDate(formSubmission: DatabaseTypes.FormSubmissions | null | undefined): string {
    const dateCreated = formSubmission?.date_created;
    if (!dateCreated) {
      return '';
    }
    return DateHelper.formatDateToTimeZoneReadable(new Date(dateCreated), EnvVariableHelper.getTimeZoneString(), DateHelper.MOMENT_FORMAT.DATE_ONLY);
  }

  // ── Abschnitte aus den Feld-Aliassen ──────────────────────────────────────

  /**
   * Fasst direkt aufeinanderfolgende Zeilen mit demselben Präfix zu einem Abschnitt zusammen.
   * Ein Präfix, das nur ein einziges Feld betrifft, wird nicht zum Abschnitt – dann bleibt die
   * vollständige Beschriftung stehen.
   */
  private static buildSections(labelledRows: LabelledRow[]): FormDocumentSection[] {
    const sections: FormDocumentSection[] = [];

    let index = 0;
    while (index < labelledRows.length) {
      const currentLabelledRow = labelledRows[index];
      if (!currentLabelledRow) {
        break;
      }
      const groupTitle = currentLabelledRow.groupTitle;

      let endIndex = index + 1;
      if (groupTitle) {
        while (labelledRows[endIndex]?.groupTitle === groupTitle) {
          endIndex++;
        }
      }

      const runLength = endIndex - index;
      const isSection = groupTitle !== null && runLength > 1;

      if (isSection) {
        sections.push({
          title: groupTitle,
          rows: labelledRows.slice(index, endIndex).map(labelledRow => ({ ...labelledRow.row, label: labelledRow.labelWithoutGroup })),
        });
      } else {
        const row = { ...currentLabelledRow.row, label: currentLabelledRow.fullLabel };
        const lastSection = sections[sections.length - 1];
        if (lastSection && lastSection.title === null) {
          lastSection.rows.push(row);
        } else {
          sections.push({ title: null, rows: [row] });
        }
      }

      index = isSection ? endIndex : index + 1;
    }

    return sections;
  }

  private static splitLabelIntoGroupAndLabel(row: FormDocumentRow): LabelledRow {
    const fullLabel = row.label;
    const separatorIndex = fullLabel.indexOf(this.GROUP_SEPARATOR);
    const groupTitle = separatorIndex > 0 ? fullLabel.slice(0, separatorIndex).trim() : '';
    const labelWithoutGroup = separatorIndex > 0 ? fullLabel.slice(separatorIndex + 1).trim() : '';

    if (!groupTitle || !labelWithoutGroup) {
      return { groupTitle: null, labelWithoutGroup: fullLabel, fullLabel, row };
    }
    return { groupTitle, labelWithoutGroup, fullLabel, row };
  }

  // ── Einzelne Zeilen ───────────────────────────────────────────────────────

  /**
   * Die Beschriftung eines Feldes: der übersetzte Name, sonst der Alias, sonst die Id.
   *
   * Der Alias ist der interne Name, den der Formularautor vergeben hat. Sobald es eine
   * Übersetzung gibt, ist sie der Text, den Nutzer auch in der App lesen – und damit der Text,
   * der auf dem Ausdruck stehen muss.
   */
  private static getFieldLabel(formExtract: FormExtractRelevantInformationSingle): string {
    return this.getContentTranslation(formExtract.form_field.translations, 'name') || formExtract.form_field.alias || formExtract.form_field.id;
  }

  /** Der Kleingedruckte Hinweis unter der Beschriftung, aus der Beschreibung des Feldes. */
  private static getFieldHint(formExtract: FormExtractRelevantInformationSingle): string | null {
    return this.getContentTranslation(formExtract.form_field.translations, 'description');
  }

  /**
   * Ein Feld aus den `*_translations`-Zeilen eines Items, auf Deutsch.
   *
   * Das Dokument ist ein deutscher Vordruck, deshalb steht hier fest die deutsche Sprache und
   * nicht die Sprache eines Nutzers. Sind die Übersetzungen gar nicht mitgeladen (dann stehen
   * dort nur Ids), liefert der Helper nichts und der Aufrufer fällt auf den Alias zurück.
   */
  private static getContentTranslation(translations: unknown, fieldName: string): string | null {
    const translationRows = (translations ?? []) as ExistingTranslation[];
    const value = ContentTranslationHelper.getTranslation(translationRows, ContentTranslationHelper.LANGUAGE_CODE_DE, fieldName);
    if (typeof value !== 'string') {
      return null;
    }
    const trimmedValue = value.trim();
    return trimmedValue.length > 0 ? trimmedValue : null;
  }

  private static buildRowForField(label: string, hint: string | null, formExtract: FormExtractRelevantInformationSingle): FormDocumentRow | null {
    const fieldType = formExtract.form_field.field_type ?? '';
    const FIELD_TYPE = FormHelperCommon.FORM_FIELD_TYPE;

    if (fieldType === FIELD_TYPE.BOOLEAN_CHECKBOX) {
      return this.buildBooleanRow(label, hint, formExtract.form_answer.value_boolean);
    }
    if (fieldType === FIELD_TYPE.STRING_BANK_ACCOUNT || fieldType === FIELD_TYPE.STRING_BIC) {
      return this.buildCharacterBoxesRow(label, hint, formExtract.form_answer.value_string, fieldType);
    }
    if (fieldType === FIELD_TYPE.MULTILINE_TEXT) {
      return { type: 'multiline', label, hint, text: formExtract.form_answer.value_string ?? '' };
    }
    if (FormHelperCommon.isDateFieldType(fieldType)) {
      return { type: 'text', label, hint, text: this.formatDateValue(formExtract) };
    }
    if (formExtract.form_answer.value_number !== null && formExtract.form_answer.value_number !== undefined) {
      return { type: 'text', label, hint, text: this.formatValueWithPrefixAndSuffix(formExtract.form_answer.value_number, formExtract.form_field) };
    }
    if (fieldType === FIELD_TYPE.NUMBER) {
      return { type: 'text', label, hint, text: '' };
    }
    if (fieldType === FIELD_TYPE.FILES_IMAGE || fieldType === FIELD_TYPE.FILES_FILES) {
      // Ein Bildfeld ohne Bild bekommt keine leere Zeile – siehe Dateikopf.
      return null;
    }

    const value = formExtract.form_answer.value_string;
    return {
      type: 'text',
      label,
      hint,
      text: value ? this.formatValueWithPrefixAndSuffix(value, formExtract.form_field) : '',
    };
  }

  private static buildBooleanRow(label: string, hint: string | null, value: boolean | null | undefined): FormDocumentRow {
    return {
      type: 'boolean',
      label,
      hint,
      text: '',
      options: [
        { label: BackendTranslator.translate(BackendTranslationKeys.no), checked: value === false },
        { label: BackendTranslator.translate(BackendTranslationKeys.yes), checked: value === true },
      ],
    };
  }

  private static buildCharacterBoxesRow(label: string, hint: string | null, value: string | null | undefined, fieldType: string): FormDocumentRow {
    const cleanedValue = value ? StringHelper.replaceAllWithOptions({ str: value, find: String.raw`\s`, replace: '' }).toUpperCase() : '';
    const emptyBoxCount = fieldType === FormHelperCommon.FORM_FIELD_TYPE.STRING_BIC ? this.EMPTY_BOX_COUNT_BIC : this.EMPTY_BOX_COUNT_IBAN;
    const characterCount = cleanedValue.length > 0 ? cleanedValue.length : emptyBoxCount;

    const boxGroups: string[][] = [];
    let currentGroup: string[] = [];
    for (let index = 0; index < characterCount; index++) {
      if (index % this.CHARACTER_BOX_GROUP_SIZE === 0) {
        currentGroup = [];
        boxGroups.push(currentGroup);
      }
      currentGroup.push(cleanedValue[index] ?? '');
    }

    return { type: 'character_boxes', label, hint, text: cleanedValue, boxGroups };
  }

  private static formatDateValue(formExtract: FormExtractRelevantInformationSingle): string {
    const value = formExtract.form_answer.value_date;
    if (!value) {
      return '';
    }
    const momentFormat = this.getMomentFormatForFieldType(formExtract.form_field.field_type ?? '');
    return DateHelper.formatDateToTimeZoneReadable(new Date(value), EnvVariableHelper.getTimeZoneString(), momentFormat);
  }

  private static getMomentFormatForFieldType(fieldType: string): string {
    switch (fieldType) {
      case FormHelperCommon.FORM_FIELD_TYPE.DATE_HH_MM:
        return DateHelper.MOMENT_FORMAT.DATE_HH_MM;
      case FormHelperCommon.FORM_FIELD_TYPE.DATE_DATE_AND_HH_MM:
        return DateHelper.MOMENT_FORMAT.DATE_AND_HH_MM;
      case FormHelperCommon.FORM_FIELD_TYPE.DATE_TIMESTAMP:
        return DateHelper.MOMENT_FORMAT.DATE_TIMESTAMP;
      default:
        return DateHelper.MOMENT_FORMAT.DATE_ONLY;
    }
  }

  private static formatValueWithPrefixAndSuffix(value: string | number, formField: DatabaseTypes.FormFields): string {
    const prefix = formField.value_prefix || '';
    const suffix = formField.value_suffix || '';
    let formattedValue: string;
    if (typeof value === 'number') {
      // Deutsche Schreibweise: Komma als Dezimaltrenner, Punkt als Tausendertrenner.
      formattedValue = NumberHelper.formatNumber(value, null, true, ',', '.', 2);
    } else {
      formattedValue = value;
    }
    return `${prefix}${formattedValue}${suffix}`;
  }

  // ── Bilder ────────────────────────────────────────────────────────────────

  private static buildAttachmentsForField(label: string, formExtract: FormExtractRelevantInformationSingle, myDatabaseHelperInterface: MyDatabaseTestableHelperInterface): FormDocumentAttachment[] {
    const imageUrls: string[] = [];

    const imageUrl = this.resolveImageUrl(formExtract.form_answer.value_image, myDatabaseHelperInterface, false);
    if (imageUrl) {
      imageUrls.push(imageUrl);
    }
    for (const file of formExtract.form_answer.value_files || []) {
      const fileUrl = this.resolveFileUrl(file, myDatabaseHelperInterface);
      if (fileUrl) {
        imageUrls.push(fileUrl);
      }
    }

    return imageUrls.map((url, index) => ({
      label: imageUrls.length > 1 ? `${label} (${index + 1}/${imageUrls.length})` : label,
      imageUrl: url,
    }));
  }

  private static resolveImageUrl(value_image: DatabaseTypes.DirectusFiles | string | null | undefined, myDatabaseHelperInterface: MyDatabaseTestableHelperInterface, isSignature: boolean): string | null {
    if (!value_image) {
      return null;
    }
    if (typeof value_image === 'string' && (value_image.startsWith('http') || value_image.startsWith('data:'))) {
      return value_image;
    }
    // Eine Unterschrift ist kein quadratisches Bild und darf nicht beschnitten werden.
    const transformOptions = isSignature ? this.SIGNATURE_TRANSFORM_OPTIONS : this.IMAGE_TRANSFORM_OPTIONS;
    return DirectusFilesAssetHelper.getDirectAssetUrlByObjectOrId(value_image, myDatabaseHelperInterface, transformOptions) ?? null;
  }

  private static resolveFileUrl(value_file: FormExtractFormAnswerValueFileSingleOrString | null | undefined, myDatabaseHelperInterface: MyDatabaseTestableHelperInterface): string | null {
    if (!value_file) {
      return null;
    }
    if (typeof value_file === 'string') {
      return value_file.startsWith('http') || value_file.startsWith('data:') ? value_file : null;
    }
    const valueFileAsObject = value_file as FormExtractFormAnswerValueFileSingle;
    return DirectusFilesAssetHelper.getDirectAssetUrlByObjectOrId(valueFileAsObject.directus_files_id, myDatabaseHelperInterface, this.IMAGE_TRANSFORM_OPTIONS) ?? null;
  }
}
