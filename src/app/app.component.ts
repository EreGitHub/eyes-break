import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { RouterOutlet } from '@angular/router';

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
export class AppComponent {}
