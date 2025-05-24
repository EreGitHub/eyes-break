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
  public isSessionRunning: WritableSignal<boolean>;
  public progress: WritableSignal<number>;
  public title: WritableSignal<string>;

  public readonly START_TITLE = 'Comenzar';
  public readonly STOP_TITLE = 'Detener';

  constructor() {
    this.isSessionRunning = signal(false);
    this.title = signal(this.START_TITLE);
    this.progress = signal(0);
  }

  public startSession(): void {
    listen<number>('session-progress', event => {
      this.progress.set(Number(event.payload.toFixed(0)));
    });

    listen('session-completed', () => {
      console.log('Session completed');
      this.isSessionRunning.set(false);
      this.title.set(this.START_TITLE);
    });

    invoke('start_session', { totalTimeMs: 5000 });
    this.isSessionRunning.set(true);
    this.title.set(this.STOP_TITLE);
  }
}
