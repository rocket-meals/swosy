/**
 * AppFeedbackAnswerMail.ts – the mail a user gets when support answers their app feedback.
 *
 * The answer lands in the chat of the feedback, but a user who left a contact email may not open
 * the app again soon. So the answer goes to that address as well, in the language of the profile.
 *
 * Plain logic without Directus imports, so it can be unit tested in Node.
 */

import { AppFeedbackContentHelper, DatabaseTypes, EmailHelper, type Translator } from 'repo-depkit-common';
import { BackendTranslationKeys } from '../helpers/translations/BackendTranslationKeys';

export type AppFeedbackAnswerMailInput = {
  feedback: Pick<DatabaseTypes.AppFeedbacks, 'contact_email' | 'title' | 'content'>;
  /** What support wrote in the chat. */
  answer: string | null | undefined;
  projectName: string;
  translate: Translator<BackendTranslationKeys>;
};

export type AppFeedbackAnswerMailContent = {
  recipient: string;
  subject: string;
  markdown_content: string;
};

export class AppFeedbackAnswerMail {
  /** The trimmed contact email, `undefined` when there is none or it is not a valid address. */
  static getRecipient(feedback: Pick<DatabaseTypes.AppFeedbacks, 'contact_email'>): string | undefined {
    const { trimmedEmail, isValid } = EmailHelper.sanitizeAndValidate(feedback.contact_email ?? '');
    return isValid ? trimmedEmail : undefined;
  }

  /** Every line as a markdown quote, so the original feedback stands apart from the answer. */
  static quote(text: string): string {
    return text
      .split('\n')
      .map(line => `> ${line}`)
      .join('\n');
  }

  /** The mail to send, `undefined` when there is no valid contact email or no answer text. */
  static build(input: AppFeedbackAnswerMailInput): AppFeedbackAnswerMailContent | undefined {
    const recipient = AppFeedbackAnswerMail.getRecipient(input.feedback);
    const answer = input.answer?.trim();
    if (!recipient || !answer) {
      return undefined;
    }

    const { translate } = input;
    const originalFeedback = [input.feedback.title?.trim(), AppFeedbackContentHelper.stripAppState(input.feedback.content).trim()]
      .filter(part => !!part)
      .join('\n\n');

    const lines = [translate(BackendTranslationKeys.app_feedback_answer_mail_intro), '', answer, ''];
    if (originalFeedback) {
      lines.push(`## ${translate(BackendTranslationKeys.app_feedback_answer_mail_your_feedback)}`, '', AppFeedbackAnswerMail.quote(originalFeedback), '');
    }
    lines.push(translate(BackendTranslationKeys.app_feedback_answer_mail_reply_hint));

    return {
      recipient,
      subject: translate(BackendTranslationKeys.app_feedback_answer_mail_subject, { project: input.projectName }),
      markdown_content: lines.join('\n'),
    };
  }
}
