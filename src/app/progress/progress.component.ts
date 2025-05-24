import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'eb-progress',
  imports: [FormsModule],
  templateUrl: './progress.component.html',
  styleUrl: './progress.component.scss',
  // encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressComponent implements OnInit, AfterViewInit {
  @ViewChild('progressRing', { static: true }) progressRing!: ElementRef<SVGCircleElement>;
  @ViewChild('progressPulse', { static: true }) progressPulse!: ElementRef<SVGCircleElement>;
  @ViewChild('particlesContainer', { static: true })
  particlesContainer!: ElementRef<HTMLDivElement>;
  public initialProgress: number = 0;

  currentProgress: number = 0;
  displayProgress: number = 0;
  inputValue: number = 0;
  private radius: number = 100;
  private circumference: number = 2 * Math.PI * 100;
  private animationId: number | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.createParticles();
    this.initializeProgressRing();
    this.animateProgress();
    this.setProgress(this.initialProgress);
  }

  private initializeProgressRing(): void {
    const progressElement = this.progressRing.nativeElement;
    const pulseElement = this.progressPulse.nativeElement;

    progressElement.style.strokeDasharray = `${this.circumference} ${this.circumference}`;
    progressElement.style.strokeDashoffset = this.circumference.toString();

    pulseElement.style.strokeDasharray = `${this.circumference} ${this.circumference}`;
    pulseElement.style.strokeDashoffset = this.circumference.toString();
  }

  private createParticles(): void {
    const container = this.particlesContainer.nativeElement;
    container.innerHTML = '';

    for (let i = 0; i < 12; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';

      const angle = (i / 12) * 360;
      const radius = 110;
      const x = Math.cos((angle * Math.PI) / 180) * radius;
      const y = Math.sin((angle * Math.PI) / 180) * radius;

      particle.style.left = `${110 + x}px`;
      particle.style.top = `${110 + y}px`;
      particle.style.animationDelay = `${i * 0.3}s`;

      container.appendChild(particle);
    }
  }

  setProgress(percent: number): void {
    percent = Math.max(0, Math.min(100, percent));
    this.currentProgress = percent;
    this.inputValue = percent;

    const offset = this.circumference - (percent / 100) * this.circumference;

    this.progressRing.nativeElement.style.strokeDashoffset = offset.toString();
    this.progressPulse.nativeElement.style.strokeDashoffset = offset.toString();

    this.animateText(percent);
    this.updateEffects(percent);
    this.animateParticles(percent);
  }

  private animateText(targetPercent: number): void {
    const startPercent = this.displayProgress;
    const duration = 800;
    const startTime = performance.now();

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easeOut = 1 - Math.pow(1 - progress, 4);
      const currentPercent = Math.round(startPercent + (targetPercent - startPercent) * easeOut);

      this.displayProgress = currentPercent;
      this.cdr.detectChanges();

      if (progress < 1) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        this.animationId = null;
      }
    };

    this.animationId = requestAnimationFrame(animate);
  }

  private updateEffects(percent: number): void {
    const gradient = document.getElementById('progressGradient');

    if (gradient) {
      if (percent < 25) {
        gradient.innerHTML = `
          <stop offset="0%" style="stop-color:#ff6b9d;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#c44569;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#ff6b9d;stop-opacity:1" />
        `;
      } else if (percent < 50) {
        gradient.innerHTML = `
          <stop offset="0%" style="stop-color:#feca57;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#ff9ff3;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#feca57;stop-opacity:1" />
        `;
      } else if (percent < 75) {
        gradient.innerHTML = `
          <stop offset="0%" style="stop-color:#78dbff;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#7877c6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#78dbff;stop-opacity:1" />
        `;
      } else {
        gradient.innerHTML = `
          <stop offset="0%" style="stop-color:#1dd1a1;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#10ac84;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1dd1a1;stop-opacity:1" />
        `;
      }
    }

    const glowIntensity = 0.3 + (percent / 100) * 0.7;
    this.progressRing.nativeElement.style.filter = `drop-shadow(0 0 ${15 + percent * 0.3}px rgba(120, 219, 255, ${glowIntensity}))`;
  }

  private animateParticles(percent: number): void {
    const particles = this.particlesContainer.nativeElement.querySelectorAll('.particle');
    const activeParticles = Math.floor((percent / 100) * particles.length);

    particles.forEach((particle, index) => {
      const element = particle as HTMLElement;
      if (index < activeParticles) {
        element.style.opacity = '1';
        element.style.animation = `particleFloat 4s ease-in-out infinite ${index * 0.1}s`;
      } else {
        element.style.opacity = '0.2';
      }
    });
  }

  animateProgress(): void {
    let progress = 0;
    const targetProgress = 100;
    const duration = 3000;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progressRatio = Math.min(elapsed / duration, 1);

      const easeInOut =
        progressRatio < 0.5
          ? 4 * progressRatio * progressRatio * progressRatio
          : 1 - Math.pow(-2 * progressRatio + 2, 3) / 2;

      progress = Math.round(targetProgress * easeInOut);
      this.setProgress(progress);

      if (progressRatio < 1) {
        requestAnimationFrame(animate);
      } else {
        setTimeout(() => {
          this.celebrationEffect();
        }, 500);
      }
    };

    requestAnimationFrame(animate);
  }

  private celebrationEffect(): void {
    const container = this.particlesContainer.nativeElement;

    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.style.position = 'absolute';
      particle.style.width = '6px';
      particle.style.height = '6px';
      particle.style.background = 'rgba(120, 219, 255, 0.9)';
      particle.style.borderRadius = '50%';
      particle.style.pointerEvents = 'none';
      particle.style.left = '50%';
      particle.style.top = '50%';
      particle.style.boxShadow = '0 0 15px rgba(120, 219, 255, 0.9)';

      container.appendChild(particle);

      const angle = (i / 20) * 360;
      const distance = 150;
      const x = Math.cos((angle * Math.PI) / 180) * distance;
      const y = Math.sin((angle * Math.PI) / 180) * distance;

      const animation = particle.animate(
        [
          { transform: 'translate(-50%, -50%) scale(0)', opacity: 1 },
          { transform: `translate(${x}px, ${y}px) scale(1.5)`, opacity: 0 },
        ],
        {
          duration: 1500,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        }
      );

      animation.onfinish = () => {
        particle.remove();
      };
    }
  }

  resetProgress(): void {
    this.setProgress(0);
  }

  onInputChange(event: any): void {
    const value = Math.max(0, Math.min(100, parseInt(event.target.value) || 0));
    this.setProgress(value);
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      const value = Math.max(0, Math.min(100, this.inputValue || 0));
      this.setProgress(value);
    }
  }
}
