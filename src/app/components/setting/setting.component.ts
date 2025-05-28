import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
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
import { TranslationService } from '../../services/translation.service';

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
  public availableLangs: WritableSignal<AvailableLangModel[]>;

  public selectedLangId: string;
  public settingsForm!: FormGroup;

  private readonly _EMPTY: string = '';

  private readonly _translationService = inject(TranslationService);
  private readonly _formBuilder = inject(FormBuilder);

  constructor() {
    this.availableLangs = signal(displayLanguageOptions);
    this.selectedLangId = this._translationService.getActiveLang();
  }

  public ngOnInit(): void {
    this._initializeForm();
    this._loadSettings();
  }

  public onLanguageChange(): void {
    this._translationService.setActiveLang(this.selectedLangId);
  }

  public saveSettings(): void {
    if (this.settingsForm.valid) {
      const settings = this.settingsForm.value;

      const formattedSettings = {
        ...settings,
        workTime: this._formatTime(settings.workTime),
        breakTime: this._formatTime(settings.breakTime),
      };

      localStorage.setItem('appSettings', JSON.stringify(formattedSettings));

      // Show success message or notification
      // You can implement a toast or notification service here
      console.log('Settings saved successfully');
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.settingsForm.controls).forEach(key => {
        const control = this.settingsForm.get(key);
        control?.markAsTouched();
      });
    }
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
    // const timeValidator = (control: FormControl): ValidationErrors | null => {
    //   const time = control.value;
    //   if (!time) {
    //     return null;
    //   }

    //   // Ensure the time is in HH:MM:SS format
    //   if (!/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(time)) {
    //     return { invalidFormat: true };
    //   }

    //   const [hours, minutes, seconds] = time.split(':').map(Number);

    //   if (hours === 0 && minutes === 0 && seconds === 0) {
    //     return { zeroTime: true };
    //   }

    //   return null;
    // };

    // // Format time to ensure HH:MM:SS format
    // const formatTimeValue = (time: string): string => {
    //   if (!time) return '00:00:00';
    //   const [h = '00', m = '00', s = '00'] = time.split(':');
    //   return `${h.padStart(2, '0')}:${m.padStart(2, '0')}:${s.padStart(2, '0')}`;
    // };

    this.settingsForm = this._formBuilder.group({
      workTime: [
        '00:20:00',
        [
          Validators.required,
          Validators.pattern(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/),
          this._timeValidator,
        ],
      ],
      breakTime: [
        '00:05:00',
        [
          Validators.required,
          Validators.pattern(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/),
          this._timeValidator,
        ],
      ],
      notificationsEnabled: [true],
      soundEnabled: [true],
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

  private _loadSettings(): void {
    const savedSettings = localStorage.getItem('appSettings');

    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        this.settingsForm.patchValue({
          workTime: settings.workTime || '00:25:00',
          breakTime: settings.breakTime || '00:05:00',
          notificationsEnabled: settings.notificationsEnabled !== false,
          soundEnabled: settings.soundEnabled !== false,
        });
      } catch (e) {
        console.error('Error loading settings:', e);
      }
    }
  }
}
