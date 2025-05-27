import { EnvironmentProviders, makeEnvironmentProviders, Provider } from '@angular/core';
import { AudioManagerService } from './audio-manager.service';
import { NotificationService } from './notification.service';
import { TauriService } from './tauri.service';
import { TimerService } from './timer.service';

export function provideServices(): EnvironmentProviders {
  const providers: Provider[] = [
    AudioManagerService,
    NotificationService,
    TauriService,
    TimerService,
  ];

  return makeEnvironmentProviders(providers);
}
