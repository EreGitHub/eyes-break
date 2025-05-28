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
import { provideServices } from '../services/provider-services';
import { TranslationService } from '../services/translation.service';
import { TranslocoHttpLoader } from '../services/transloco-loader.service';
import { provideSessionConfig } from '../tokens/session-config.token';
import { LangEnum, supportedLanguages } from './transloco.config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideSessionConfig(),
    provideServices(),
    provideHttpClient(),
    provideTransloco({
      config: {
        availableLangs: supportedLanguages,
        defaultLang: LangEnum.EN,
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
    provideAppInitializer(() => {
      inject(TranslationService).initConfig();
    }),
  ],
};
