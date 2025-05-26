import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
  ViewEncapsulation,
  WritableSignal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { app } from '@tauri-apps/api';
import { defaultWindowIcon } from '@tauri-apps/api/app';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { Menu } from '@tauri-apps/api/menu';
import { TrayIcon, TrayIconOptions } from '@tauri-apps/api/tray';
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification';
import { concatMap, delay, from, of } from 'rxjs';
import { StateSessionEnum } from '../models/state-session.model';
// import { getCurrentWindow } from '@tauri-apps/api/window';

@Component({
  selector: 'eb-home',
  imports: [],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class HomeComponent implements OnInit {
  public currentMessage: WritableSignal<string>;
  public permissionGrantedNotification: WritableSignal<boolean>;
  public progress: WritableSignal<number>;
  public stateSession: WritableSignal<StateSessionEnum>;
  public timerBreak: WritableSignal<string>;
  public timerWork: WritableSignal<string>;
  public title: WritableSignal<string>;

  public readonly _EMPTY: string = '';
  public readonly START_TITLE: string = 'Comenzar';
  public readonly STATE_SESSION: typeof StateSessionEnum = StateSessionEnum;
  public readonly STOP_TITLE: string = 'Detener';

  private readonly _destroyRef = inject(DestroyRef);

  constructor() {
    this.stateSession = signal(StateSessionEnum.WAITING);
    this.permissionGrantedNotification = signal(false);
    this.currentMessage = signal(this._EMPTY);
    this.title = signal(this.START_TITLE);
    this.timerBreak = signal(this._EMPTY);
    this.timerWork = signal(this._EMPTY);
    this.progress = signal(0);
  }

  public async ngOnInit(): Promise<void> {
    const menu: Menu = await Menu.new({
      items: [
        {
          id: 'quit',
          text: 'Quit',
          action: () => {
            // getCurrentWindow().close();
            invoke('exit_app');
          },
        },
        {
          id: 'hide',
          text: 'Hide',
          action: () => {
            app.hide();
          },
        },
        {
          id: 'show',
          text: 'Show',
          action: () => {
            app.show();
          },
        },
      ],
    });

    const options: TrayIconOptions = {
      menu,
      icon: (await defaultWindowIcon()) || '',
      menuOnLeftClick: true,
      tooltip: 'Eyes Break',
    };

    const tray = await TrayIcon.new(options);
    tray.setMenu(menu);

    this._startMessageRotation(this.stateSession());
    this.timerWork.set(this._getTimeSession(StateSessionEnum.WORK));
    this.timerBreak.set(this._getTimeSession(StateSessionEnum.BREAK));
    this.permissionGrantedNotification.set(await isPermissionGranted());

    if (!this.permissionGrantedNotification()) {
      await requestPermission();
    }
  }

  public toogleSession(): void {
    if (this.stateSession() !== StateSessionEnum.WAITING) {
      this._cancel();

      return;
    }

    listen<number>('session-progress', event => {
      this.progress.set(Number(event.payload.toFixed(0)));
    });

    listen<string>('session-time-left', event => {
      const remaining: string = event.payload;

      if (this.stateSession() === StateSessionEnum.WORK) {
        this.timerWork.set(remaining);
      } else {
        this.timerBreak.set(remaining);
      }
    });

    listen('session-completed', () => {
      this.stateSession.set(
        this.stateSession() === StateSessionEnum.WORK
          ? StateSessionEnum.BREAK
          : StateSessionEnum.WORK
      );

      if (this.stateSession() !== StateSessionEnum.WAITING) {
        const timerWork = this._getTimeSession(this.stateSession());

        invoke('start_session', { durationStr: timerWork });
        app.hide();
      }

      if (this.stateSession() === StateSessionEnum.BREAK) {
        this._notify('Descanso', 'Es hora de descansar');

        this.timerWork.set(this._getTimeSession(StateSessionEnum.WORK));
        app.show();
      } else if (this.stateSession() === StateSessionEnum.WORK) {
        this.timerBreak.set(this._getTimeSession(StateSessionEnum.BREAK));
      }

      this._startMessageRotation(this.stateSession());
    });

    this.stateSession.set(StateSessionEnum.WORK);
    this.title.set(this.STOP_TITLE);
    const timerWork = this._getTimeSession(this.stateSession());
    invoke('start_session', { durationStr: timerWork });
    this._startMessageRotation(this.stateSession());
    app.hide();
  }

  private _cancel(): void {
    listen('session-cancelled', () => {
      this.stateSession.set(StateSessionEnum.WAITING);
      this.progress.set(0);
      this.title.set(this.START_TITLE);
      this._startMessageRotation(this.stateSession());
      this.timerWork.set(this._getTimeSession(StateSessionEnum.WORK));
      this.timerBreak.set(this._getTimeSession(StateSessionEnum.BREAK));
    });

    invoke('cancel_session');
  }

  private async _notify(title: string, body: string): Promise<void> {
    if (!this.permissionGrantedNotification()) {
      const permission: NotificationPermission = await requestPermission();

      this.permissionGrantedNotification.set(permission === 'granted');
    }

    if (this.permissionGrantedNotification()) {
      sendNotification({ title, body });
    }
  }

  private _startMessageRotation(state: StateSessionEnum): void {
    const fullMessage = this._storeMessages(state);

    from(fullMessage.split(this._EMPTY))
      .pipe(
        concatMap((_, i) => of(fullMessage.slice(0, i + 1)).pipe(delay(70))),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe(partial => {
        this.currentMessage.set(partial);
      });
  }

  private _storeMessages(estate: StateSessionEnum): string {
    const messages: Record<StateSessionEnum, string> = {
      [StateSessionEnum.WAITING]: 'En espera para iniciar',
      [StateSessionEnum.WORK]: 'Enfócate en tu trabajo...',
      [StateSessionEnum.BREAK]: 'Mira 6 metros durante 20 segundos',
    };

    return messages[estate];
  }

  private _getTimeSession(estate: StateSessionEnum): string {
    const times: Record<StateSessionEnum, string> = {
      [StateSessionEnum.WAITING]: '00:00:00',
      [StateSessionEnum.WORK]: '00:20:00',
      [StateSessionEnum.BREAK]: '00:20:00',
    };

    return times[estate];
  }
}
