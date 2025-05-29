import { inject, Injectable } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { Observable } from 'rxjs';
import { LangEnum } from '../config/transloco.config';
import { AppSettingsService } from './app-settings.service';

@Injectable()
export class TranslationService {
  private readonly _translocoService = inject(TranslocoService);
  private readonly _settingsService = inject(AppSettingsService);

  public initConfig(): void {
    const lang: LangEnum = this._settingsService.settings().language;

    this._translocoService.setActiveLang(lang);
  }

  public setActiveLang(lang: LangEnum): void {
    this._translocoService.setActiveLang(lang);
  }

  public getActiveLang(): LangEnum {
    return this._translocoService.getActiveLang() as LangEnum;
  }

  public translate(key: string): string {
    return this._translocoService.translate(key);
  }

  public selectTranslate<T>(key: string): Observable<T> {
    return this._translocoService.selectTranslate<T>(key);
  }
}
