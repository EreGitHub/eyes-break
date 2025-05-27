import { Injectable } from '@angular/core';
import { app } from '@tauri-apps/api';
import { defaultWindowIcon } from '@tauri-apps/api/app';
import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { Menu } from '@tauri-apps/api/menu';
import { TrayIcon, TrayIconOptions } from '@tauri-apps/api/tray';
import { SessionDispatchEnum } from '../models/state-session.model';
// import { getCurrentWindow } from '@tauri-apps/api/window';

@Injectable({
  providedIn: 'root',
})
export class TauriService {
  private _listeners: UnlistenFn[];

  constructor() {
    this._listeners = [];
  }

  public async buildMenu(): Promise<void> {
    const menu: Menu = await this._createTrayMenu();
    const options: TrayIconOptions = {
      menu,
      icon: (await defaultWindowIcon()) || '',
      menuOnLeftClick: true,
      tooltip: 'Eyes Break',
    };

    const tray: TrayIcon = await TrayIcon.new(options);

    tray.setMenu(menu);
  }

  public async hideApp(): Promise<void> {
    await app.hide();
  }

  public async showApp(): Promise<void> {
    await app.show();
  }

  public async listen<T>(event: string, callback: (payload: T) => void): Promise<void> {
    const unlisten: UnlistenFn = await listen<T>(event, event => {
      callback(event.payload);
    });

    this._listeners.push(unlisten);
  }

  public async listenOnce<T>(event: string, callback: (payload: T) => void): Promise<void> {
    const unlisten: UnlistenFn = await listen<T>(event, event => {
      callback(event.payload);
      unlisten();
    });
  }

  public async dispatch(event: string, payload?: any): Promise<void> {
    await invoke(event, payload);
  }

  public cleanupListeners(): void {
    this._listeners.forEach(unlisten => unlisten());
    this._listeners = [];
  }

  private async _createTrayMenu(): Promise<Menu> {
    return Menu.new({
      items: [
        {
          id: 'quit',
          text: 'Quit',
          action: () => {
            this.dispatch(SessionDispatchEnum.EXIT_APP);
            // getCurrentWindow().close();
          },
        },
        {
          id: 'hide',
          text: 'Hide',
          action: () => {
            this.hideApp();
          },
        },
        {
          id: 'show',
          text: 'Show',
          action: () => {
            this.showApp();
          },
        },
      ],
    });
  }
}
