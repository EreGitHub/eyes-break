import { animate, style, transition, trigger } from '@angular/animations';

export const fadeScale = trigger('fadeScale', [
  transition(':enter', [
    style({ opacity: 0, transform: 'scale(0.95)' }),
    animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1)' })),
  ]),
  transition(':leave', [animate('200ms ease-in', style({ opacity: 0, transform: 'scale(0.95)' }))]),
]);
