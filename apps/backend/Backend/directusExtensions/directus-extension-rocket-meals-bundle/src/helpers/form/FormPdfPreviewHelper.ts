/**
 * FormPdfPreviewHelper.ts – baut aus den Werten, die eine App gerade im Formular stehen hat,
 * die Eingabe für {@link FormHelper.generatePdfFromForm}.
 *
 * Das Formular-PDF entsteht sonst erst, wenn eine Einreichung verschickt wird: der Hook liest
 * die gespeicherten Antworten und hängt das Dokument an die Mail. Wer ein Formular ausfüllt,
 * sieht bis dahin nicht, wie der Ausdruck aussehen wird. Die Vorschau schließt diese Lücke –
 * sie bekommt die Werte aus der App und liefert dasselbe Dokument zurück, ohne etwas zu
 * speichern.
 *
 * Zwei Dinge unterscheiden die Vorschau von der Einreichung:
 * - **Die Felder bestimmt das Formular, nicht die Anfrage.** Es werden immer alle Felder des
 *   Formulars gedruckt, in der Reihenfolge des Formulars. Eine Anfrage steuert nur die Werte
 *   bei; ein Feld, zu dem nichts kommt, bleibt leer – genau wie auf dem Papiervordruck.
 * - **Bilder nur aus der eigenen Installation.** Als Bildwert gilt eine Directus-Datei-Id oder
 *   ein `data:image/...`-Base64-Bild (so liegt eine frisch gezeichnete Unterschrift in der App
 *   vor, bevor sie hochgeladen ist). Eine beliebige URL wird verworfen: sonst könnte die
 *   Vorschau den Browser des Servers auf eine fremde Adresse schicken und deren Inhalt ins PDF
 *   holen.
 */

import { FormExtractFormAnswer, FormExtractFormAnswerValueFileSingleOrString, FormExtractRelevantInformation } from '../../forms-sync-hook';
import { DatabaseTypes } from 'repo-depkit-common';

/** Eine Antwort, wie sie in der Anfrage steht – ungeprüft, deshalb durchweg `unknown`. */
export type FormPdfPreviewAnswerInput = {
  form_field?: unknown;
  value_string?: unknown;
  value_number?: unknown;
  value_boolean?: unknown;
  value_date?: unknown;
  value_custom?: unknown;
  value_image?: unknown;
  value_files?: unknown;
};

/** Die geprüfte Anfrage: welches Formular, welcher Vorgang, welche Werte. */
export type FormPdfPreviewRequest = {
  form_id: string;
  /** Der Vorgang, dessen Kennung und Datum im Kopf stehen sollen – optional. */
  form_submission_id: string | null;
  answers: FormPdfPreviewAnswerInput[];
};

/** Die Anfrage taugt nicht; der Aufrufer soll einen 400er bekommen. */
export class FormPdfPreviewBadRequestError extends Error {}

export class FormPdfPreviewHelper {
  /** Eine Directus-Datei-Id ist eine UUID – alles andere ist keine Datei dieser Installation. */
  private static readonly UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  /** Nur Bilder, und nur eingebettete: `data:image/png;base64,...`. */
  private static readonly DATA_IMAGE_PREFIX = 'data:image/';

  // ── Anfrage ───────────────────────────────────────────────────────────────

  public static parseRequest(body: unknown): FormPdfPreviewRequest {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new FormPdfPreviewBadRequestError('The request body must be an object.');
    }

    const bodyAsObject = body as { form_id?: unknown; form_submission_id?: unknown; answers?: unknown };

    const form_id = this.asNonEmptyString(bodyAsObject.form_id);
    if (!form_id) {
      throw new FormPdfPreviewBadRequestError('The field form_id is required.');
    }

    const answersRaw = bodyAsObject.answers;
    if (answersRaw !== undefined && answersRaw !== null && !Array.isArray(answersRaw)) {
      throw new FormPdfPreviewBadRequestError('The field answers must be an array.');
    }

    const answers: FormPdfPreviewAnswerInput[] = [];
    for (const answerRaw of (answersRaw ?? []) as unknown[]) {
      if (!answerRaw || typeof answerRaw !== 'object' || Array.isArray(answerRaw)) {
        throw new FormPdfPreviewBadRequestError('Every entry of answers must be an object.');
      }
      answers.push(answerRaw as FormPdfPreviewAnswerInput);
    }

    return {
      form_id,
      form_submission_id: this.asNonEmptyString(bodyAsObject.form_submission_id) ?? null,
      answers,
    };
  }

  // ── Felder und Werte ──────────────────────────────────────────────────────

  /**
   * Alle Felder des Formulars in Formularreihenfolge, jedes mit dem Wert aus der Anfrage.
   *
   * Felder, zu denen die Anfrage nichts sagt, bleiben leer. Werte zu Feldern, die es im
   * Formular nicht gibt, werden verworfen – gedruckt wird das Formular, nicht die Anfrage.
   */
  public static buildFormExtractRelevantInformation(formFields: DatabaseTypes.FormFields[], answers: FormPdfPreviewAnswerInput[]): FormExtractRelevantInformation {
    const answersByFieldId = new Map<string, FormPdfPreviewAnswerInput>();
    for (const answer of answers) {
      const fieldId = this.asNonEmptyString(answer.form_field);
      if (fieldId) {
        answersByFieldId.set(fieldId, answer);
      }
    }

    return this.sortFormFieldsBySort(formFields).map(formField => ({
      form_field_id: formField.id,
      sort: formField.sort,
      form_field: formField,
      form_answer: this.buildFormAnswer(formField, answersByFieldId.get(formField.id)),
    }));
  }

  /**
   * Die Felder in der Reihenfolge, die der Formularautor vergeben hat; Felder ohne `sort`
   * hängen hinten an. Dieselbe Reihenfolge wie beim Versand einer Einreichung.
   */
  private static sortFormFieldsBySort(formFields: DatabaseTypes.FormFields[]): DatabaseTypes.FormFields[] {
    return [...formFields].sort((a, b) => {
      if (a.sort === null || a.sort === undefined) {
        return 1;
      }
      if (b.sort === null || b.sort === undefined) {
        return -1;
      }
      return a.sort - b.sort;
    });
  }

  /** Eine Antwortzeile, wie sie in der Datenbank stünde – nur eben nie gespeichert. */
  private static buildFormAnswer(formField: DatabaseTypes.FormFields, answer: FormPdfPreviewAnswerInput | undefined): FormExtractFormAnswer {
    return {
      form_field: formField.id,
      id: `preview-${formField.id}`,
      value_string: this.asStringOrNull(answer?.value_string),
      value_number: this.asNumberOrNull(answer?.value_number),
      value_boolean: this.asBooleanOrNull(answer?.value_boolean),
      value_date: this.asStringOrNull(answer?.value_date),
      value_custom: this.asStringOrNull(answer?.value_custom),
      value_image: this.asImageReferenceOrNull(answer?.value_image),
      value_files: this.asFileReferences(answer?.value_files),
    } as unknown as FormExtractFormAnswer;
  }

  // ── Einzelne Werte ────────────────────────────────────────────────────────

  private static asNonEmptyString(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }
    const trimmedValue = value.trim();
    return trimmedValue.length > 0 ? trimmedValue : null;
  }

  private static asStringOrNull(value: unknown): string | null {
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    return null;
  }

  /**
   * Zahlen kommen aus der App als Text, und zwar in deutscher Schreibweise („1.234,56").
   * Das Dokument setzt sie selbst – hier wird nur wieder eine Zahl daraus.
   */
  private static asNumberOrNull(value: unknown): number | null {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }
    const valueAsString = this.asNonEmptyString(value);
    if (!valueAsString) {
      return null;
    }
    const normalizedValue = valueAsString.includes(',') ? valueAsString.split('.').join('').split(',').join('.') : valueAsString;
    const parsedValue = Number.parseFloat(normalizedValue);
    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  /**
   * Ein Ankreuzfeld kennt drei Zustände: ja, nein und „nicht beantwortet". Die App schickt je
   * nach Eingabefeld `true`/`false`, `1`/`0` oder den Text dazu.
   */
  private static asBooleanOrNull(value: unknown): boolean | null {
    if (typeof value === 'boolean') {
      return value;
    }
    if (value === 1 || value === '1' || value === 'true') {
      return true;
    }
    if (value === 0 || value === '0' || value === 'false') {
      return false;
    }
    return null;
  }

  /**
   * Ein Bildwert ist entweder eine Datei dieser Installation oder ein eingebettetes Bild.
   * Alles andere – vor allem eine URL – wird verworfen, siehe Dateikopf.
   */
  private static asImageReferenceOrNull(value: unknown): string | null {
    const valueAsString = this.asNonEmptyString(value);
    if (!valueAsString) {
      return null;
    }
    if (this.UUID_PATTERN.test(valueAsString)) {
      return valueAsString;
    }
    return valueAsString.startsWith(this.DATA_IMAGE_PREFIX) ? valueAsString : null;
  }

  /**
   * Die Anhänge eines Feldes. Eine Datei-Id wird in die Form gebracht, in der das Dokument
   * daraus eine Asset-Adresse bauen kann; ein eingebettetes Bild bleibt, wie es ist.
   */
  private static asFileReferences(value: unknown): FormExtractFormAnswerValueFileSingleOrString[] {
    if (!Array.isArray(value)) {
      return [];
    }

    const fileReferences: FormExtractFormAnswerValueFileSingleOrString[] = [];
    for (const entry of value) {
      const entryAsFileId = this.asNonEmptyString(entry) ?? this.asNonEmptyString((entry as { directus_files_id?: unknown })?.directus_files_id);
      if (!entryAsFileId) {
        continue;
      }
      if (this.UUID_PATTERN.test(entryAsFileId)) {
        fileReferences.push({ directus_files_id: entryAsFileId, form_answers_id: '', id: fileReferences.length });
        continue;
      }
      if (entryAsFileId.startsWith(this.DATA_IMAGE_PREFIX)) {
        fileReferences.push(entryAsFileId);
      }
    }
    return fileReferences;
  }
}
