export enum StateSessionEnum {
  WORK,
  BREAK,
  WAITING,
}

// animations: [
//   trigger('fadeInOut', [
//     transition(':enter', [
//       style({ opacity: 0, transform: 'scale(0.95)' }),
//       animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1)' })),
//     ]),
//     transition(':leave', [
//       animate('200ms ease-in', style({ opacity: 0, transform: 'scale(0.95)' })),
//     ]),
//   ]),
// ],
//====
// animations: [
//   trigger('slideDownUp', [
//     // Entrada: baja desde arriba
//     transition(':enter', [
//       style({ opacity: 0, transform: 'translateY(-20px)' }),
//       animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
//     ]),
//     // Salida: sube hacia arriba
//     transition(':leave', [
//       animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-20px)' })),
//     ]),
//   ]),
// ],
//======
// animations: [
//   trigger('fadeInOut', [
//     transition(':enter', [
//       style({ opacity: 0, transform: 'translateY(-10px)' }),
//       animate('500ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
//     ]),
//     transition(':leave', [
//       animate('500ms ease-in', style({ opacity: 0, transform: 'translateY(10px)' })),
//     ]),
//   ]),
// ],
