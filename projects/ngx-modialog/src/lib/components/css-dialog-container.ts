import {
  Component,
  ViewEncapsulation,
  ElementRef,
  Renderer2
} from '@angular/core';

import { BaseDynamicComponent } from './base-dynamic-component';
import { DialogRef } from '../models/dialog-ref';

/**
 * A component that acts as a top level container for an open modal window.
 */
@Component({
    // tslint:disable-next-line:component-selector
    selector: 'css-dialog-container',
    host: {
        'tabindex': '-1',
        'role': 'dialog'
    },
    encapsulation: ViewEncapsulation.None,
    template: `
    <ng-content></ng-content>`,
    standalone: false
})
// tslint:disable-next-line:component-class-suffix
export class CSSDialogContainer extends BaseDynamicComponent {

  constructor(public dialog: DialogRef<any>, el: ElementRef, renderer: Renderer2) {
    super(el, renderer);
    this.activateAnimationListener();
  }

}
