import { Injectable } from '@angular/core';
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification';

@Injectable()
export class NotificationService {
  private permissionGranted = false;

  public async initialize(): Promise<void> {
    this.permissionGranted = await isPermissionGranted();

    if (!this.permissionGranted) {
      const permission = await requestPermission();
      this.permissionGranted = permission === 'granted';
    }
  }

  public async notify(title: string, body: string): Promise<void> {
    if (!this.permissionGranted) {
      await this.initialize();
    }

    if (this.permissionGranted) {
      sendNotification({ title, body });
    }
  }

  public get hasPermission(): boolean {
    return this.permissionGranted;
  }
}
