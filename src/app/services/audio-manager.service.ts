import { Injectable } from '@angular/core';

@Injectable()
export class AudioManagerService {
  private readonly _breakSound: HTMLAudioElement;
  private readonly _welcomeSound: HTMLAudioElement;
  private readonly _workSound: HTMLAudioElement;

  constructor() {
    this._welcomeSound = new Audio('sounds/welcome.wav');
    this._breakSound = new Audio('sounds/break.wav');
    this._workSound = new Audio('sounds/work.wav');
  }

  public playBreakSound(): void {
    this._breakSound.currentTime = 0;

    this._breakSound.load();
    this._breakSound.play().catch(error => {
      console.error('Error playing break sound:', error);
    });
  }

  public playWelcomeSound(): void {
    this._welcomeSound.currentTime = 0;

    this._welcomeSound.load();
    this._welcomeSound.play().catch(error => {
      console.error('Error playing welcome sound:', error);
    });
  }

  public playWorkSound(): void {
    this._workSound.currentTime = 0;

    this._workSound.load();
    this._workSound.play().catch(error => {
      console.error('Error playing work sound:', error);
    });
  }
}
