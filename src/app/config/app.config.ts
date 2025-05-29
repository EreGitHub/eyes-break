import { provideHttpClient } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideTransloco } from '@jsverse/transloco';
import { routes } from '../app.routes';
import { AppSettingsService } from '../services/app-settings.service';
import { provideServices } from '../services/provider-services';
import { TranslationService } from '../services/translation.service';
import { TranslocoHttpLoader } from '../services/transloco-loader.service';
import { provideAppSettings } from '../tokens/app-settings.token';
import configTransloco from './transloco.config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAppSettings(),
    provideServices(),
    provideHttpClient(),
    provideTransloco({
      config: {
        availableLangs: configTransloco.langs,
        defaultLang: configTransloco.defaultLang,
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
    provideAppInitializer(() => {
      const appSettingsService = inject(AppSettingsService);
      const translationService = inject(TranslationService);

      appSettingsService.loadSettings().then(() => {
        translationService.initConfig();
      });
    }),
  ],
};
