import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  OnInit,
  signal,
  ViewEncapsulation,
  WritableSignal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoModule } from '@jsverse/transloco';
import { concatMap, delay, from, of, Subject, switchMap, takeUntil, timer } from 'rxjs';
import { fadeScale } from '../../config/animations/fade-scale';
import { ClickOutsideDirective } from '../../directives/click-outside-directive.directive';
import { AppSettings } from '../../models/session-conf.model';
import { SessionEventPayloadEnum, StateSessionEnum } from '../../models/state-session.model';
import { AppSettingsService } from '../../services/app-settings.service';
import { AudioManagerService } from '../../services/audio-manager.service';
import { NotificationService } from '../../services/notification.service';
import { TauriService } from '../../services/tauri.service';
import { TimerService } from '../../services/timer.service';
import { TranslationService } from '../../services/translation.service';
import { SettingComponent } from '../setting/setting.component';
// import { getCurrentWindow } from '@tauri-apps/api/window';

@Component({
  selector: 'eb-home',
  imports: [NgClass, SettingComponent, ClickOutsideDirective, TranslocoModule],
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

  public readonly STATE_SESSION: typeof StateSessionEnum = StateSessionEnum;

  private _cancelTimer$: Subject<void>;
  private _cancelAnimation$: Subject<void>;

  private readonly _ANIMATED_AFTER_STARTED_DELAY: number = 3000;
  private readonly _EMPTY: string = '';
  private readonly _sessionDurationKeys: Record<StateSessionEnum, string>;
  private readonly _sessionMessageKeys: Record<StateSessionEnum, string>;
  private readonly _START_TITLE: string = 'home.start';
  private readonly _STOP_TITLE: string = 'home.stop';

  private readonly _audioManagerService = inject(AudioManagerService);
  private readonly _notificationService = inject(NotificationService);
  private readonly _translationService = inject(TranslationService);
  private readonly _appSettingsService = inject(AppSettingsService);
  private readonly _tauriService = inject(TauriService);
  private readonly _timerService = inject(TimerService);
  private readonly _destroyRef = inject(DestroyRef);

  constructor() {
    this._sessionDurationKeys = {
      [StateSessionEnum.WAITING]: '00:00:00',
      [StateSessionEnum.WORK]: this._appSettingsService.settings().workTime,
      [StateSessionEnum.BREAK]: this._appSettingsService.settings().breakTime,
    };
    this._sessionMessageKeys = {
      [StateSessionEnum.WAITING]: 'home.messages.waiting',
      [StateSessionEnum.WORK]: 'home.messages.work',
      [StateSessionEnum.BREAK]: 'home.messages.break',
    };
    this.stateSession = signal(StateSessionEnum.WAITING);
    this._cancelAnimation$ = new Subject<void>();
    this.currentMessage = signal(this._EMPTY);
    this.animatedAfterStarted = signal(false);
    this._cancelTimer$ = new Subject<void>();
    this.title = signal(this._START_TITLE);
    this.timerBreak = signal(this._EMPTY);
    this.timerWork = signal(this._EMPTY);
    this.isShowModal = signal(false);
    this.progress = signal(0);

    effect(() => {
      const settings: AppSettings = this._appSettingsService.settings();

      this._updateSessionDurations(settings);
    });
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
      this._startMessageRotation(this.stateSession());
      this._setupSessionListeners();
      await this._notificationService.initialize();
      await this._tauriService.buildMenu();
      this._initializeTimersValuesView();
      this._audioManagerService.playWelcomeSound();
    } catch (error) {
      console.error('Error initializing app:', error);
    }
  }

  private _initializeTimersValuesView(): void {
    this.timerWork.set(this._sessionDurationKeys[StateSessionEnum.WORK]);
    this.timerBreak.set(this._sessionDurationKeys[StateSessionEnum.BREAK]);
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
    this.title.set(this._STOP_TITLE);

    this._startMessageRotation(this.stateSession());

    const duration: string = this._sessionDurationKeys[this.stateSession()];

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

  private _updateTimerDisplay(time: string): void {
    if (this.stateSession() === StateSessionEnum.WORK) {
      this.timerWork.set(time);
    } else {
      this.timerBreak.set(time);
    }
  }

  private async _handleSessionCompleted(): Promise<void> {
    const nextState: StateSessionEnum = this._getNextSessionState();

    this.stateSession.set(nextState);

    if (this.stateSession() !== StateSessionEnum.WAITING) {
      const duration: string = this._sessionDurationKeys[this.stateSession()];

      this._timerService.startSession(duration);

      if (this.stateSession() === StateSessionEnum.BREAK) {
        await this._handleBreakSession();
      } else {
        await this._handleWorkSession();
      }
    }

    this._startMessageRotation(this.stateSession());
  }

  private async _handleBreakSession(): Promise<void> {
    this.timerWork.set(this._sessionDurationKeys[StateSessionEnum.WORK]);

    if (this._appSettingsService.settings().soundEnabled) {
      this._audioManagerService.playBreakSound();
    }

    if (this._appSettingsService.settings().notificationsEnabled) {
      await this._notificationService.notify(
        this._translationService.translate('notifications.break.title'),
        this._translationService.translate('notifications.break.message')
      );
    }

    await this._tauriService.showApp();
  }

  private async _handleWorkSession(): Promise<void> {
    this.timerBreak.set(this._sessionDurationKeys[StateSessionEnum.BREAK]);

    if (this._appSettingsService.settings().soundEnabled) {
      this._audioManagerService.playWorkSound();
    }
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
    this.title.set(this._START_TITLE);
    this.timerWork.set(this._sessionDurationKeys[StateSessionEnum.WORK]);
    this.timerBreak.set(this._sessionDurationKeys[StateSessionEnum.BREAK]);

    this._startMessageRotation(this.stateSession());
  }

  private _startMessageRotation(state: StateSessionEnum): void {
    this._cancelAnimation$.next();

    this._translationService
      .selectTranslate<string>(this._sessionMessageKeys[state])
      .pipe(
        switchMap((message: string) =>
          from(message.split(this._EMPTY)).pipe(
            concatMap((_, index: number) =>
              of(message.slice(0, index + 1)).pipe(
                delay(this._appSettingsService.settings().messageAnimationDelay)
              )
            )
          )
        ),
        takeUntil(this._cancelAnimation$),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe(partialMessage => {
        this.currentMessage.set(partialMessage);
      });
  }

  private _updateSessionDurations(settings: AppSettings): void {
    this._sessionDurationKeys[StateSessionEnum.WORK] = settings.workTime;
    this._sessionDurationKeys[StateSessionEnum.BREAK] = settings.breakTime;

    if (this.stateSession() === StateSessionEnum.WAITING) {
      this.timerWork.set(settings.workTime);
      this.timerBreak.set(settings.breakTime);
    }
  }
}
