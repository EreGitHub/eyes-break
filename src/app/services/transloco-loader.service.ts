import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Translation, TranslocoLoader } from '@jsverse/transloco';
import { Observable } from 'rxjs';

@Injectable()
export class TranslocoHttpLoader implements TranslocoLoader {
  private readonly _httpClient = inject(HttpClient);

  public getTranslation(lang: string): Observable<Translation> {
    return this._httpClient.get<Translation>(`i18n/${lang}.json`);
  }
}
