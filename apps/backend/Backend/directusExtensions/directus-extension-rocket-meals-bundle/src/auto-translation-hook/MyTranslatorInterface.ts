export type TranslationRequest = {
  text: string;
  source_language: string;
  destination_language: string;
};

export interface MyTranslatorInterface {
  init(): Promise<void>;

  translate(request: TranslationRequest): Promise<any>;

  getUsage(): Promise<any>;

  getExtra(): Promise<any>;
}
