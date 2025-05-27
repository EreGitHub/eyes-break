import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  isDevMode,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import { fromEvent } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `
    <div class="eb-app">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [
    `
      .eb-app {
        height: 100vh;
      }
    `,
  ],
  // styles: ['@import "./config/styles/index.scss";'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  private readonly _CONTEXT_MENU_EVENT = 'contextmenu';

  private readonly _destroyRef = inject(DestroyRef);
  private readonly _document = inject(DOCUMENT);

  public ngOnInit(): void {
    if (!isDevMode()) {
      fromEvent<MouseEvent>(this._document, this._CONTEXT_MENU_EVENT)
        .pipe(takeUntilDestroyed(this._destroyRef))
        .subscribe(event => {
          event.preventDefault();
        });
    }
  }
}
