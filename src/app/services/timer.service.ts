import { inject, Injectable } from '@angular/core';
import { SessionDispatchEnum } from '../models/state-session.model';
import { TauriService } from './tauri.service';

@Injectable({
  providedIn: 'root',
})
export class TimerService {
  private readonly _tauriService = inject(TauriService);

  public async startSession(duration: string): Promise<void> {
    try {
      this._tauriService.dispatch(SessionDispatchEnum.SESSION_STARTED, { durationStr: duration });
    } catch (error) {
      console.error('Error starting session:', error);
      throw error;
    }
  }

  public async cancelSession(): Promise<void> {
    try {
      this._tauriService.dispatch(SessionDispatchEnum.SESSION_CANCELLED);
    } catch (error) {
      console.error('Error cancelling session:', error);
      throw error;
    }
  }
}
