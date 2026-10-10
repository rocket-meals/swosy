/**
 * AppFeedbackAnswerMail.ts – the mails the author of an app feedback gets when support answers.
 *
 * Two cases, depending on how the feedback is answered (`AppFeedbackChatHelper.getAnswerChannel`):
 * - **By mail** (no profile, but a contact email): the answer is the whole conversation. The mail
 *   contains it and asks not to reply – nobody reads the sender address.
 * - **In the chat** (the author has a profile): the answer is in the app. The mail goes to the
 *   account address of the author or the contact email of the feedback, whichever has a mailbox
 *   (`ChatMailRecipientHelper`). It contains the answer and points to the menu item "Chats" of the
 *   app to reply there – no link, the web app would not know a guest of the native app. The
 *   support address is named for authors who cannot use the app. A chat without app feedback
 *   (e.g. of a food feedback) gets the same mail without the quoted feedback.
 *
 * Plain logic without Directus imports, so it can be unit tested in Node.
 */

import { AppFeedbackContentHelper, DatabaseTypes, type Translator } from 'repo-depkit-common';
import { BackendTranslationKeys } from '../translations/BackendTranslationKeys';
import { AppFeedbackChatHelper } from './AppFeedbackChatHelper';

type AnsweredFeedback = Pick<DatabaseTypes.AppFeedbacks, 'contact_email' | 'title' | 'content'>;

type AppFeedbackAnswerMailInput = {
  feedback: AnsweredFeedback;
  /** What support wrote. */
  answer: string | null | undefined;
  projectName: string;
  translate: Translator<BackendTranslationKeys>;
};

export type AppFeedbackChatAnswerMailInput = AppFeedbackAnswerMailInput & {
  /** The address authors can write to when they cannot answer in the app. */
  supportEmail: string;
  /** Where the mail goes – the contact email of the feedback when not given. */
  recipient?: string;
};

export type ChatAnswerMailInput = Omit<AppFeedbackChatAnswerMailInput, 'feedback' | 'recipient'> & {
  recipient: string;
};

export type AppFeedbackAnswerMailContent = {
  recipient: string;
  subject: string;
  markdown_content: string;
};

export class AppFeedbackAnswerMail {
  /** Every line as a markdown quote, so the original feedback stands apart from the answer. */
  static quote(text: string): string {
    return text
      .split('\n')
      .map(line => `> ${line}`)
      .join('\n');
  }

  /** The answer to a feedback without profile – sent instead of a chat. */
  static buildMailAnswer(input: AppFeedbackAnswerMailInput): AppFeedbackAnswerMailContent | undefined {
    return AppFeedbackAnswerMail.build(input, BackendTranslationKeys.app_feedback_answer_mail_intro, [input.translate(BackendTranslationKeys.app_feedback_answer_mail_no_reply_hint)]);
  }

  /** The note about a new answer in the chat of a feedback, for authors who left a contact email. */
  static buildChatAnswer(input: AppFeedbackChatAnswerMailInput): AppFeedbackAnswerMailContent | undefined {
    return AppFeedbackAnswerMail.build(input, BackendTranslationKeys.app_feedback_chat_answer_mail_intro, [input.translate(BackendTranslationKeys.app_feedback_chat_answer_mail_reply_hint, { email: input.supportEmail })], input.recipient);
  }

  /** The note about a new answer in a chat that belongs to no app feedback. `undefined` without answer text. */
  static buildChatAnswerWithoutFeedback(input: ChatAnswerMailInput): AppFeedbackAnswerMailContent | undefined {
    const answer = input.answer?.trim();
    if (!answer) {
      return undefined;
    }
    const { translate } = input;
    return {
      recipient: input.recipient,
      subject: translate(BackendTranslationKeys.chat_answer_mail_subject, { project: input.projectName }),
      markdown_content: [translate(BackendTranslationKeys.chat_answer_mail_intro), '', answer, '', translate(BackendTranslationKeys.app_feedback_chat_answer_mail_reply_hint, { email: input.supportEmail })].join('\n'),
    };
  }

  /** `undefined` when there is no recipient (given or valid contact email) or no answer text. */
  private static build(input: AppFeedbackAnswerMailInput, introKey: BackendTranslationKeys, closing: string[], recipientOverride?: string): AppFeedbackAnswerMailContent | undefined {
    const recipient = recipientOverride ?? AppFeedbackChatHelper.getContactEmail(input.feedback);
    const answer = input.answer?.trim();
    if (!recipient || !answer) {
      return undefined;
    }

    const { translate } = input;
    const originalFeedback = [input.feedback.title?.trim(), AppFeedbackContentHelper.stripAppState(input.feedback.content).trim()]
      .filter(part => !!part)
      .join('\n\n');

    const lines = [translate(introKey), '', answer, ''];
    if (originalFeedback) {
      lines.push(`## ${translate(BackendTranslationKeys.app_feedback_answer_mail_your_feedback)}`, '', AppFeedbackAnswerMail.quote(originalFeedback), '');
    }
    lines.push(...closing);

    return {
      recipient,
      subject: translate(BackendTranslationKeys.app_feedback_answer_mail_subject, { project: input.projectName }),
      markdown_content: lines.join('\n'),
    };
  }
}
