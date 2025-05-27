import { NgClass } from '@angular/common';
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
import { concatMap, delay, from, of, Subject, takeUntil, timer } from 'rxjs';
import { fadeScale } from '../../config/animations/fade-scale';
import { ClickOutsideDirective } from '../../directives/click-outside-directive.directive';
import { SessionEventPayloadEnum, StateSessionEnum } from '../../models/state-session.model';
import { AudioManagerService } from '../../services/audio-manager.service';
import { NotificationService } from '../../services/notification.service';
import { TauriService } from '../../services/tauri.service';
import { TimerService } from '../../services/timer.service';
import { SESSION_CONFIG } from '../../tokens/session-config.token';
import { SettingComponent } from '../setting/setting.component';
// import { getCurrentWindow } from '@tauri-apps/api/window';

@Component({
  selector: 'eb-home',
  imports: [NgClass, SettingComponent, ClickOutsideDirective],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [fadeScale],
})
export default class HomeComponent implements OnInit {
  public animatedAfterStarted: WritableSignal<boolean>;
  public currentMessage: WritableSignal<string>;
  public isShowModal: WritableSignal<boolean>;
  public progress: WritableSignal<number>;
  public stateSession: WritableSignal<StateSessionEnum>;
  public timerBreak: WritableSignal<string>;
  public timerWork: WritableSignal<string>;
  public title: WritableSignal<string>;

  public readonly START_TITLE: string = 'Comenzar';
  public readonly STATE_SESSION: typeof StateSessionEnum = StateSessionEnum;
  public readonly STOP_TITLE: string = 'Detener';

  private readonly _ANIMATED_AFTER_STARTED_DELAY: number = 4500;
  private readonly _EMPTY: string = '';

  private _cancelTimer$: Subject<void>;

  //TODO: internalize messages
  private readonly sessionMessages: Record<StateSessionEnum, string> = {
    [StateSessionEnum.WAITING]: 'En espera para iniciar',
    [StateSessionEnum.WORK]: 'Enfócate en tu trabajo...',
    [StateSessionEnum.BREAK]: 'Mira 6 metros durante 20 segundos',
  };

  private readonly _audioManagerService = inject(AudioManagerService);
  private readonly _notificationService = inject(NotificationService);
  private readonly _sessionConfig = inject(SESSION_CONFIG);
  private readonly _tauriService = inject(TauriService);
  private readonly _timerService = inject(TimerService);
  private readonly _destroyRef = inject(DestroyRef);

  constructor() {
    this.stateSession = signal(StateSessionEnum.WAITING);
    this.currentMessage = signal(this._EMPTY);
    this.animatedAfterStarted = signal(false);
    this.title = signal(this.START_TITLE);
    this.timerBreak = signal(this._EMPTY);
    this.timerWork = signal(this._EMPTY);
    this.isShowModal = signal(false);
    this._cancelTimer$ = new Subject<void>();
    this.progress = signal(0);
  }

  public async ngOnInit(): Promise<void> {
    await this._initializeApp();
  }

  public toogleSession(): void {
    if (this.stateSession() !== StateSessionEnum.WAITING) {
      this._timerService.cancelSession();
    } else {
      this._startSession();
    }
  }

  public showModal(): void {
    this.isShowModal.set(true);
  }

  public closeModal(): void {
    this.isShowModal.set(false);
  }

  private async _initializeApp(): Promise<void> {
    try {
      this._setupSessionListeners();
      await this._notificationService.initialize();
      await this._tauriService.buildMenu();
      this._initializeTimersValuesView();
      this._startMessageRotation(this.stateSession());
      this._audioManagerService.playWelcomeSound();
    } catch (error) {
      console.error('Error initializing app:', error);
    }
  }

  private _initializeTimersValuesView(): void {
    //TODO:read from config user settings
    this.timerWork.set(this._getSessionDuration(StateSessionEnum.WORK));
    this.timerBreak.set(this._getSessionDuration(StateSessionEnum.BREAK));
  }

  private _setupSessionListeners(): void {
    this._tauriService.cleanupListeners();

    this._tauriService.listen<number>(SessionEventPayloadEnum.SESSION_PROGRESS, progress => {
      this.progress.set(Math.round(progress));
    });

    this._tauriService.listen<string>(SessionEventPayloadEnum.SESSION_TIME_PROGRESS, timeLeft => {
      this._updateTimerDisplay(timeLeft);
    });

    this._tauriService.listen(SessionEventPayloadEnum.SESSION_COMPLETED, async () => {
      await this._handleSessionCompleted();
    });

    this._tauriService.listen(SessionEventPayloadEnum.SESSION_CANCELLED, () => {
      this._resetSessionState();
    });
  }

  private _startSession(): void {
    this.stateSession.set(StateSessionEnum.WORK);
    this.title.set(this.STOP_TITLE);

    this._startMessageRotation(this.stateSession());

    const duration: string = this._getSessionDuration(this.stateSession());

    this._timerService.startSession(duration);
    this._startAnimated();
  }

  private _startAnimated(): void {
    this.animatedAfterStarted.set(true);

    this._cancelTimer$.next();

    timer(this._ANIMATED_AFTER_STARTED_DELAY)
      .pipe(takeUntil(this._cancelTimer$), takeUntilDestroyed(this._destroyRef))
      .subscribe(() => {
        this.animatedAfterStarted.set(false);

        this._tauriService.hideApp();
      });
  }

  private _updateTimerDisplay(timeLeft: string): void {
    if (this.stateSession() === StateSessionEnum.WORK) {
      this.timerWork.set(timeLeft);
    } else {
      this.timerBreak.set(timeLeft);
    }
  }

  private async _handleSessionCompleted(): Promise<void> {
    const nextState: StateSessionEnum = this._getNextSessionState();

    this.stateSession.set(nextState);

    if (this.stateSession() !== StateSessionEnum.WAITING) {
      const duration: string = this._getSessionDuration(this.stateSession());

      this._timerService.startSession(duration);

      if (this.stateSession() === StateSessionEnum.BREAK) {
        this._audioManagerService.playBreakSound();
        await this._handleBreakSession();
      } else {
        this._audioManagerService.playWorkSound();
        await this._handleWorkSession();
      }
    }

    this._startMessageRotation(this.stateSession());
  }

  private async _handleBreakSession(): Promise<void> {
    this.timerWork.set(this._getSessionDuration(StateSessionEnum.WORK));

    await this._notificationService.notify('Descanso...', '😃 Es hora de descansar');
    await this._tauriService.showApp();
  }

  private async _handleWorkSession(): Promise<void> {
    this.timerBreak.set(this._getSessionDuration(StateSessionEnum.BREAK));

    this._startAnimated();
  }

  private _getNextSessionState(): StateSessionEnum {
    return this.stateSession() === StateSessionEnum.WORK
      ? StateSessionEnum.BREAK
      : StateSessionEnum.WORK;
  }

  private _resetSessionState(): void {
    this._cancelTimer$.next();

    this.stateSession.set(StateSessionEnum.WAITING);
    this.animatedAfterStarted.set(false);
    this.progress.set(0);
    this.title.set(this.START_TITLE);
    this.timerWork.set(this._getSessionDuration(StateSessionEnum.WORK));
    this.timerBreak.set(this._getSessionDuration(StateSessionEnum.BREAK));

    this._startMessageRotation(this.stateSession());
  }

  private _startMessageRotation(state: StateSessionEnum): void {
    const message: string = this.sessionMessages[state];

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

  private _getSessionDuration(state: StateSessionEnum): string {
    const durations: Record<StateSessionEnum, string> = {
      [StateSessionEnum.WAITING]: '00:00:00',
      [StateSessionEnum.WORK]: this._sessionConfig.workDuration,
      [StateSessionEnum.BREAK]: this._sessionConfig.breakDuration,
    };

    return durations[state];
  }
}
