import {
  EnvironmentProviders,
  InjectionToken,
  makeEnvironmentProviders,
  Provider,
} from '@angular/core';
import { defaultLanguage } from '../config/transloco.config';
import { AppSettings } from '../models/session-conf.model';

const defaultSettings: AppSettings = {
  breakTime: '00:00:20',
  language: defaultLanguage,
  messageAnimationDelay: 70,
  notificationsEnabled: true,
  soundEnabled: true,
  workTime: '00:20:00',
};

export const APP_SETTINGS = new InjectionToken<AppSettings>('APP_SETTINGS');

export function provideAppSettings(): EnvironmentProviders {
  const providers: Provider[] = [
    {
      provide: APP_SETTINGS,
      useValue: defaultSettings,
    },
  ];

  return makeEnvironmentProviders(providers);
}
