import { TranslocoGlobalConfig } from '@jsverse/transloco-utils';
import { AvailableLangModel } from '../models/available-lang.model';

export enum LangEnum {
  EN = 'en',
  ES = 'es',
}

export const displayLanguageOptions: AvailableLangModel[] = [
  { id: LangEnum.EN, label: 'English' },
  { id: LangEnum.ES, label: 'Español' },
];

export const supportedLanguages = [LangEnum.EN, LangEnum.ES];

const config: TranslocoGlobalConfig = {
  rootTranslationsPath: 'i18n/',
  langs: supportedLanguages,
  defaultLang: LangEnum.EN,
  keysManager: {},
};

export default config;
