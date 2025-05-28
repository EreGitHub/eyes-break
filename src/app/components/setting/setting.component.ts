import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  ViewEncapsulation,
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

@Component({
  selector: 'eb-setting',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingComponent implements OnInit {
  public settingsForm!: FormGroup;

  private readonly _EMPTY: string = '';

  private readonly _formBuilder = inject(FormBuilder);

  public ngOnInit(): void {
    this._initializeForm();
    this._loadSettings();
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
    }
  }

  // Format the time values to ensure HH:MM:SS format
  private _formatTime(time: string): string {
    if (!time) {
      return '00:00:00';
    }

    const [h = '00', m = '00', s = '00'] = time.split(':');

    return `${h.padStart(2, '0')}:${m.padStart(2, '0')}:${s.padStart(2, '0')}`;
  }

  public getTimeErrorMessage(controlName: string): string {
    const control = this.settingsForm.get(controlName);

    if (control?.hasError('required')) {
      return 'Este campo es requerido';
    }

    if (control?.hasError('pattern') || control?.hasError('invalidFormat')) {
      return 'Formato inválido. Usa HH:MM:SS (24h)';
    }

    if (control?.hasError('zeroTime')) {
      return 'El tiempo no puede ser 00:00:00';
    }

    return this._EMPTY;
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
    const time = control.value;

    if (!time) {
      return null;
    }

    // Ensure the time is in HH:MM:SS format
    if (!/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(time)) {
      return { invalidFormat: true };
    }

    const [hours, minutes, seconds] = time.split(':').map(Number);

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
        this.settingsForm.patchValue(settings);
      } catch (e) {
        console.error('Error loading settings:', e);
      }
    }
  }
}
