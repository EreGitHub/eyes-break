import { LangEnum } from '../config/transloco.config';

export interface AppSettings {
  // [key: string]: any; // For any additional settings
  breakTime: string;
  language: LangEnum;
  messageAnimationDelay: number;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  workTime: string;
}
