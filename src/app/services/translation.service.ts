import { inject, Injectable } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { Observable } from 'rxjs';
import { LangEnum } from '../config/transloco.config';

@Injectable()
export class TranslationService {
  private readonly _translocoService = inject(TranslocoService);

  public initConfig(): void {
    const lang: string = localStorage.getItem('userLanguage') || LangEnum.EN;

    this._translocoService.setActiveLang(lang);
  }

  public setActiveLang(lang: string): void {
    this._translocoService.setActiveLang(lang);

    localStorage.setItem('userLanguage', lang);
  }

  public getActiveLang(): string {
    return this._translocoService.getActiveLang();
  }

  public translate(key: string): string {
    return this._translocoService.translate(key);
  }

  public selectTranslate<T>(key: string): Observable<T> {
    return this._translocoService.selectTranslate<T>(key);
  }
}
