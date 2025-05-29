import { EnvironmentProviders, makeEnvironmentProviders, Provider } from '@angular/core';
import { AppSettingsService } from './app-settings.service';
import { AudioManagerService } from './audio-manager.service';
import { NotificationService } from './notification.service';
import { TauriService } from './tauri.service';
import { TimerService } from './timer.service';
import { TranslationService } from './translation.service';
import { TranslocoHttpLoader } from './transloco-loader.service';

export function provideServices(): EnvironmentProviders {
  const providers: Provider[] = [
    AppSettingsService,
    AudioManagerService,
    NotificationService,
    TauriService,
    TimerService,
    TranslationService,
    TranslocoHttpLoader,
  ];

  return makeEnvironmentProviders(providers);
}
