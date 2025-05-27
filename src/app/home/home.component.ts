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
import { concatMap, delay, from, of } from 'rxjs';
import { SessionEventPayloadEnum, StateSessionEnum } from '../models/state-session.model';
import { NotificationService } from '../services/notification.service';
import { TauriService } from '../services/tauri.service';
import { TimerService } from '../services/timer.service';
import { SESSION_CONFIG } from '../tokens/session-config.token';
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
  public readonly currentMessage: WritableSignal<string>;
  public readonly progress: WritableSignal<number>;
  public readonly stateSession: WritableSignal<StateSessionEnum>;
  public readonly timerBreak: WritableSignal<string>;
  public readonly timerWork: WritableSignal<string>;
  public readonly title: WritableSignal<string>;

  public readonly START_TITLE: string = 'Comenzar';
  public readonly STATE_SESSION: typeof StateSessionEnum = StateSessionEnum;
  public readonly STOP_TITLE: string = 'Detener';

  private readonly _EMPTY: string = '';

  //TODO: internalize messages
  private readonly sessionMessages: Record<StateSessionEnum, string> = {
    [StateSessionEnum.WAITING]: 'En espera para iniciar',
    [StateSessionEnum.WORK]: 'Enfócate en tu trabajo...',
    [StateSessionEnum.BREAK]: 'Mira 6 metros durante 20 segundos',
  };

  private readonly _notificationService = inject(NotificationService);
  private readonly _sessionConfig = inject(SESSION_CONFIG);
  private readonly _tauriService = inject(TauriService);
  private readonly _timerService = inject(TimerService);
  private readonly _destroyRef = inject(DestroyRef);

  constructor() {
    this.stateSession = signal(StateSessionEnum.WAITING);
    this.currentMessage = signal(this._EMPTY);
    this.title = signal(this.START_TITLE);
    this.timerBreak = signal(this._EMPTY);
    this.timerWork = signal(this._EMPTY);
    this.progress = signal(0);
  }

  public async ngOnInit(): Promise<void> {
    await this._initializeApp();
  }

  public toogleSession(): void {
    if (this.stateSession() !== StateSessionEnum.WAITING) {
      this._timerService.cancelSession();
    } else {
      const duration = this.getSessionDuration(StateSessionEnum.WORK);
      this._timerService.startSession(duration);
    }
  }

  private async _initializeApp(): Promise<void> {
    try {
      this.setupSessionListeners();
      await this._notificationService.initialize();
      await this._tauriService.buildMenu();
      this.initializeTimersValuesView();
      this._startMessageRotation(this.stateSession());
    } catch (error) {
      console.error('Error initializing app:', error);
    }
  }

  private initializeTimersValuesView(): void {
    //TODO:read from config user settings
    this.timerWork.set(this.getSessionDuration(StateSessionEnum.WORK));
    this.timerBreak.set(this.getSessionDuration(StateSessionEnum.BREAK));
  }

  private setupSessionListeners(): void {
    this._tauriService.cleanup();

    this._tauriService.listen<number>(SessionEventPayloadEnum.SESSION_PROGRESS, progress => {
      this.progress.set(Math.round(progress));
    });

    this._tauriService.listen<string>(SessionEventPayloadEnum.SESSION_TIME_PROGRESS, timeLeft => {
      this.updateTimerDisplay(timeLeft);
    });

    this._tauriService.listen(SessionEventPayloadEnum.SESSION_COMPLETED, async () => {
      await this.handleSessionCompleted();
    });

    this._tauriService.listen(SessionEventPayloadEnum.SESSION_CANCELLED, () => {
      this.resetSessionState();
    });

    this._tauriService.listen(SessionEventPayloadEnum.SESSION_STARTED, (isStarted: boolean) => {
      if (isStarted) {
        this._startSession();
      }
    });
  }

  private _startSession(): void {
    this.stateSession.set(StateSessionEnum.WORK);
    this.title.set(this.STOP_TITLE);

    this._startMessageRotation(this.stateSession());
    this._tauriService.hideApp();
  }

  private updateTimerDisplay(timeLeft: string): void {
    if (this.stateSession() === StateSessionEnum.WORK) {
      this.timerWork.set(timeLeft);
    } else {
      this.timerBreak.set(timeLeft);
    }
  }

  private async handleSessionCompleted(): Promise<void> {
    const nextState = this.getNextSessionState();
    this.stateSession.set(nextState);

    if (nextState !== StateSessionEnum.WAITING) {
      const duration = this.getSessionDuration(nextState);
      this._timerService.startSession(duration);

      if (nextState === StateSessionEnum.BREAK) {
        await this.handleBreakSession();
      } else {
        await this.handleWorkSession();
      }
    }

    this._startMessageRotation(nextState);
  }

  private async handleBreakSession(): Promise<void> {
    this.timerWork.set(this.getSessionDuration(StateSessionEnum.WORK));
    await this._notificationService.notify('Descanso', '😃 Es hora de descansar');
    await this._tauriService.showApp();
  }

  private async handleWorkSession(): Promise<void> {
    this.timerBreak.set(this.getSessionDuration(StateSessionEnum.BREAK));
    await this._tauriService.hideApp();
  }

  private getNextSessionState(): StateSessionEnum {
    return this.stateSession() === StateSessionEnum.WORK
      ? StateSessionEnum.BREAK
      : StateSessionEnum.WORK;
  }

  private resetSessionState(): void {
    this.stateSession.set(StateSessionEnum.WAITING);
    this.progress.set(0);
    this.title.set(this.START_TITLE);
    this._startMessageRotation(StateSessionEnum.WAITING);
    this.timerWork.set(this.getSessionDuration(StateSessionEnum.WORK));
    this.timerBreak.set(this.getSessionDuration(StateSessionEnum.BREAK));
  }

  private _startMessageRotation(state: StateSessionEnum): void {
    const message = this.sessionMessages[state];

    from(message.split(''))
      .pipe(
        concatMap((_, index) =>
          of(message.slice(0, index + 1)).pipe(delay(this._sessionConfig.messageAnimationDelay))
        ),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe(partialMessage => {
        this.currentMessage.set(partialMessage);
      });
  }

  private getSessionDuration(state: StateSessionEnum): string {
    const durations: Record<StateSessionEnum, string> = {
      [StateSessionEnum.WAITING]: '00:00:00',
      [StateSessionEnum.WORK]: this._sessionConfig.workDuration,
      [StateSessionEnum.BREAK]: this._sessionConfig.breakDuration,
    };

    return durations[state];
  }
}
