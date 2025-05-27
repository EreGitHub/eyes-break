// models/session-config.interface.ts
export interface SessionTimes {
  readonly work: string;
  readonly break: string;
  readonly waiting: string;
}

export interface SessionMessages {
  readonly waiting: string;
  readonly work: string;
  readonly break: string;
}

// services/timer.service.ts
import { inject, Injectable } from '@angular/core';
import { SessionDispatchEnum } from '../models/state-session.model';
import { TauriService } from './tauri.service';

@Injectable({
  providedIn: 'root',
})
export class TimerService {
  private readonly _tauriService = inject(TauriService);

  public startSession(duration: string): void {
    try {
      this._tauriService.dispatch(SessionDispatchEnum.SESSION_STARTED, { durationStr: duration });
    } catch (error) {
      console.error('Error starting session:', error);
      throw error;
    }
  }

  public cancelSession(): void {
    try {
      this._tauriService.dispatch(SessionDispatchEnum.SESSION_CANCELLED);
    } catch (error) {
      console.error('Error cancelling session:', error);
      throw error;
    }
  }
}
