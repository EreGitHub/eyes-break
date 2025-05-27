import { DOCUMENT } from '@angular/common';
import { DestroyRef, Directive, ElementRef, inject, OnInit, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent, merge } from 'rxjs';

@Directive({
  selector: '[lfClickOutside]',
})
export class ClickOutsideDirective implements OnInit {
  public clickOutside = output<void>();

  private readonly _CLICK_EVENTS: string[] = ['click', 'touchstart'];

  private readonly _destroyRef = inject(DestroyRef);
  private readonly _document = inject(DOCUMENT);
  private readonly _elementRef = inject(ElementRef);

  public ngOnInit() {
    this._initialize();
  }

  private _initialize(): void {
    merge(...this._CLICK_EVENTS.map((event: string) => fromEvent(this._document, event)))
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((event: Event) => {
        const targetElement = event.target as HTMLElement | null;

        if (targetElement && !this._elementRef.nativeElement.contains(targetElement)) {
          this.clickOutside.emit();
        }
      });
  }
}
