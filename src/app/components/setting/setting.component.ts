import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  output,
  signal,
  ViewEncapsulation,
  WritableSignal,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { displayLanguageOptions } from '../../config/transloco.config';
import { AvailableLangModel } from '../../models/available-lang.model';
import { AppSettings } from '../../models/session-conf.model';
import { AppSettingsService } from '../../services/app-settings.service';
import { TranslationService } from '../../services/translation.service';
import { LangEnum } from './../../config/transloco.config';

@Component({
  selector: 'eb-setting',
  standalone: true,
  imports: [FormsModule, NgClass, ReactiveFormsModule, TranslocoModule],
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingComponent implements OnInit {
  public close = output<void>();

  public availableLangs: WritableSignal<AvailableLangModel[]>;

  public selectedLangId: LangEnum;
  public settingsForm!: FormGroup;

  private readonly _EMPTY: string = '';

  private readonly _translationService = inject(TranslationService);
  private readonly _appSettingsService = inject(AppSettingsService);
  private readonly _formBuilder = inject(FormBuilder);

  constructor() {
    this.availableLangs = signal(displayLanguageOptions);
    this.selectedLangId = this._translationService.getActiveLang();
  }

  public ngOnInit(): void {
    this._initializeForm();
    this._loadSettingsForm();
  }

  public onLanguageChange(): void {
    this._translationService.setActiveLang(this.selectedLangId);
  }

  public async saveSettings(): Promise<void> {
    if (this.settingsForm.valid) {
      try {
        const settings = this.settingsForm.value;

        const formattedSettings: Partial<AppSettings> = {
          ...settings,
          language: this.selectedLangId,
          workTime: this._formatTime(settings.workTime),
          breakTime: this._formatTime(settings.breakTime),
        };

        await this._appSettingsService.saveSettings(formattedSettings);
      } catch (error) {
        console.error('Error al guardar la configuración:', error);
      }
    } else {
      // Marcar todos los campos como tocados para mostrar errores de validación
      Object.keys(this.settingsForm.controls).forEach(key => {
        const control = this.settingsForm.get(key);
        control?.markAsTouched();
      });
    }

    this.close.emit();
  }

  public async resetSettings(): Promise<void> {
    await this._appSettingsService.resetToDefaults();
    this.selectedLangId = this._appSettingsService.settings().language;

    this.onLanguageChange();
    this._loadSettingsForm();

    this.close.emit();
  }

  public formatTimeInput(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/[^0-9:]/g, ''); // Remove any non-digit and non-colon characters

    // Auto-insert colons as user types
    if (value.length > 2 && value.indexOf(':') === -1) {
      value = value.substring(0, 2) + ':' + value.substring(2);
    }
    if (value.length > 5 && value.lastIndexOf(':') === 2) {
      value = value.substring(0, 5) + ':' + value.substring(5);
    }

    // Limit to HH:MM:SS format
    if (value.length > 8) {
      value = value.substring(0, 8);
    }

    input.value = value;

    // Update the form control value
    const control = this.settingsForm.get(controlName);
    if (control) {
      control.setValue(value);
      control.updateValueAndValidity();
    }
  }

  public validateTimeInput(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    const control = this.settingsForm.get(controlName);

    if (!control) return;

    let value = input.value;

    // If empty, set to default 00:00:00
    if (!value) {
      value = '00:00:00';
      input.value = value;
      control.setValue(value);
      control.updateValueAndValidity();

      return;
    }

    // Ensure we have all parts (HH:MM:SS)
    const parts = value.split(':');
    while (parts.length < 3) {
      parts.push('00');
    }

    // Format each part to 2 digits
    const hours = parts[0].padStart(2, '0');
    const minutes = parts[1].padStart(2, '0');
    const seconds = parts[2]?.padStart(2, '0') || '00';

    // Validate time values
    const hoursNum = parseInt(hours, 10);
    const minutesNum = parseInt(minutes, 10);
    const secondsNum = parseInt(seconds, 10);

    if (
      isNaN(hoursNum) ||
      hoursNum < 0 ||
      hoursNum > 23 ||
      isNaN(minutesNum) ||
      minutesNum < 0 ||
      minutesNum > 59 ||
      isNaN(secondsNum) ||
      secondsNum < 0 ||
      secondsNum > 59
    ) {
      control.setErrors({ invalidTime: true });
      return;
    }

    // Set the formatted time
    const formattedTime = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
    input.value = formattedTime;
    control.setValue(formattedTime);
    control.updateValueAndValidity();
  }

  public getTimeErrorMessage(controlName: string): string {
    const control = this.settingsForm.get(controlName);

    if (control?.hasError('required')) {
      return this._translationService.translate('errors.required');
    }

    if (control?.hasError('pattern') || control?.hasError('invalidFormat')) {
      return this._translationService.translate('errors.invalidTimeFormat');
    }

    if (control?.hasError('zeroTime')) {
      return this._translationService.translate('errors.zeroTime');
    }

    return this._EMPTY;
  }

  // Format the time values to ensure HH:MM:SS format
  private _formatTime(time: string): string {
    if (!time) {
      return '00:00:00';
    }

    const [h = '00', m = '00', s = '00'] = time.split(':');

    return `${h.padStart(2, '0')}:${m.padStart(2, '0')}:${s.padStart(2, '0')}`;
  }

  private _initializeForm(): void {
    this.settingsForm = this._formBuilder.group({
      workTime: [
        this._appSettingsService.settings()?.workTime,
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(8),
          Validators.pattern(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/),
          this._timeValidator,
        ],
      ],
      breakTime: [
        this._appSettingsService.settings()?.breakTime,
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(8),
          Validators.pattern(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/),
          this._timeValidator,
        ],
      ],
      notificationsEnabled: [this._appSettingsService.settings()?.notificationsEnabled],
      soundEnabled: [this._appSettingsService.settings()?.soundEnabled, Validators.required],
    });
  }

  private _timeValidator(control: FormControl): ValidationErrors | null {
    const value = control.value;

    if (!value) {
      return {
        required: true,
      };
    }

    // Check if the time is in HH:MM:SS format
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;

    if (!timeRegex.test(value)) {
      return {
        invalidFormat: true,
      };
    }

    // // Check if time is 00:00:00
    // if (value === '00:00:00') {
    //   return {
    //     zeroTime: true,
    //   };
    // }

    const [hours, minutes, seconds] = value.split(':').map(Number);

    if (hours === 0 && minutes === 0 && seconds === 0) {
      return { zeroTime: true };
    }

    return null;
  }

  private _loadSettingsForm(): void {
    const settings: AppSettings = this._appSettingsService.settings();

    this.settingsForm.patchValue({
      workTime: settings.workTime,
      breakTime: settings.breakTime,
      notificationsEnabled: settings.notificationsEnabled,
      soundEnabled: settings.soundEnabled,
    });
  }
}
