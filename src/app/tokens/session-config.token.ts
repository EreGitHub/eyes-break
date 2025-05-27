import {
  EnvironmentProviders,
  InjectionToken,
  makeEnvironmentProviders,
  Provider,
} from '@angular/core';
import { SessionConfig } from '../models/session-conf.model';

export const defaultSessionConfig: SessionConfig = {
  breakDuration: '00:20:00',
  isActiveNotification: true,
  messageAnimationDelay: 70,
  workDuration: '00:00:20',
};

export const SESSION_CONFIG = new InjectionToken<SessionConfig>('SESSION_CONFIG');

export function provideSessionConfig(): EnvironmentProviders {
  const providers: Provider[] = [
    {
      provide: SESSION_CONFIG,
      useValue: defaultSessionConfig,
    },
  ];

  return makeEnvironmentProviders(providers);
}
