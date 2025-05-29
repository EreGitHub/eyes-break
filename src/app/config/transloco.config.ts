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
const supportedLanguages = [LangEnum.EN, LangEnum.ES];
export const defaultLanguage = LangEnum.EN;

const configTransloco: TranslocoGlobalConfig = {
  rootTranslationsPath: 'i18n/',
  langs: supportedLanguages,
  defaultLang: defaultLanguage,
  keysManager: {},
};

export default configTransloco;
