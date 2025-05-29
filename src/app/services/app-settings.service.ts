import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import { Store } from '@tauri-apps/plugin-store';
import { AppSettings } from '../models/session-conf.model';
import { APP_SETTINGS } from '../tokens/app-settings.token';

@Injectable()
export class AppSettingsService {
  public settings: WritableSignal<AppSettings>;

  private _store: Promise<Store>;

  private readonly _STORE_NAME = 'settings.dat';
  private readonly _STORE_KEY = 'appSettings';

  private readonly _defaultSettings = inject(APP_SETTINGS);

  constructor() {
    this.settings = signal<AppSettings>({ ...this._defaultSettings });
    this._store = Store.load(this._STORE_NAME);
  }

  public async loadSettings(): Promise<AppSettings> {
    try {
      const store: Store = await this._store;
      const savedSettings: AppSettings | undefined = await store.get<AppSettings>(this._STORE_KEY);

      const mergedSettings: AppSettings = {
        ...this._defaultSettings,
        ...(savedSettings || {}),
      };

      this.settings.set(mergedSettings);

      return mergedSettings;
    } catch (error) {
      console.error('Error loading settings:', error);

      this.settings.set({ ...this._defaultSettings });

      return { ...this._defaultSettings };
    }
  }

  public async saveSettings(settings: Partial<AppSettings>): Promise<void> {
    try {
      const currentSettings: AppSettings = this.settings();
      const updatedSettings: AppSettings = { ...currentSettings, ...settings };
      const store: Store = await this._store;

      await store.set(this._STORE_KEY, updatedSettings);
      await store.save();

      this.settings.set(updatedSettings);
    } catch (error) {
      console.error('Error saving settings:', error);

      throw error;
    }
  }

  public getSetting<T extends keyof AppSettings>(key: T): AppSettings[T] {
    return this.settings()[key];
  }

  public async updateSetting<K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ): Promise<void> {
    await this.saveSettings({ [key]: value } as Partial<AppSettings>);
  }

  public async resetToDefaults(): Promise<void> {
    await this.saveSettings({ ...this._defaultSettings });
  }
}
