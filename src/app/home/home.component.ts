import {
  ChangeDetectionStrategy,
  Component,
  signal,
  ViewEncapsulation,
  WritableSignal,
} from '@angular/core';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

@Component({
  selector: 'eb-home',
  imports: [],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class HomeComponent {
  public progress: WritableSignal<string>;

  constructor() {
    this.progress = signal('0%');
  }

  public startSession(): void {
    listen<number>('session-progress', event => {
      this.progress.set(event.payload.toFixed(0) + '%');
    });

    listen('session-completed', () => {
      console.log('Session completed');
    });

    invoke('start_session', { totalTimeMs: 5000 });
  }
}
