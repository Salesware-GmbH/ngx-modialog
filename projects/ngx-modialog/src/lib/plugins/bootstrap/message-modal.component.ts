import { Component, ViewEncapsulation, ChangeDetectionStrategy } from '@angular/core';
import { MessageModalPreset } from './presets/message-modal-preset';
import { ModalComponent } from '../../models/tokens';
import { DialogRef } from '../../models/dialog-ref';

export interface BSMessageModalButtonHandler {
  (cmp: ModalComponent<MessageModalPreset>, $event: MouseEvent): void;
}

/**
 * Interface for button definition
 */
export interface BSMessageModalButtonConfig {
  cssClass: string;
  caption: string;
  onClick: BSMessageModalButtonHandler;
}

@Component({
    selector: 'modal-title',
    encapsulation: ViewEncapsulation.None,
    template: `<div [ngClass]="context.headerClass">
      @if (context.showClose) {
        <button type="button" class="close"
                aria-label="Close" (click)="dialog.dismiss()">
            <span aria-hidden="true">×</span>
        </button>
      }
      @if (titleHtml) {
        <div [innerHtml]="context.titleHtml"></div>
      }
      @else {
        <h3 class="modal-title">{{context.title}}</h3>
      }
 </div>`,
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class BSMessageModalTitle {
  public context: MessageModalPreset;

  constructor(public dialog: DialogRef<MessageModalPreset>) {
    this.context = dialog.context;
  }

  get titleHtml(): boolean {
    return this.context.titleHtml ? true : false;
  }
}

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'modal-body',
    encapsulation: ViewEncapsulation.None,
    styles: [`.form-group {
    margin-top: 10px;
  }`],
    template: `<div [ngClass]="context.bodyClass">
      <div [innerHtml]="context.message"></div>
      @if (context.showInput) {
        <div class="form-group">
          <input autofocus #input
            name="bootstrap"
            type="text"
            class="form-control"
            [value]="context.defaultValue"
            (change)="context.defaultValue = input.value"
            placeholder="{{context.placeholder}}">
          </div>
        }
      </div>
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
// tslint:disable-next-line:component-class-suffix
export class BSMessageModalBody {
  public context: MessageModalPreset & {
    showInput: boolean;
    /** Default value shown in the prompt. */
    defaultValue: string;
    /** A placeholder for the input element. */
    placeholder: string;
  };

  constructor(public dialog: DialogRef<MessageModalPreset>) {
    this.context = <any> dialog.context;
  }
}


/**
 * Represents the modal footer for storing buttons.
 */
@Component({
    // tslint:disable-next-line:component-selector
    selector: 'modal-footer',
    encapsulation: ViewEncapsulation.None,
    template: `<div [ngClass]="dialog.context.footerClass">
      @for (btn of dialog.context.buttons; track btn) {
        <button
          [ngClass]="btn.cssClass"
        (click)="onClick(btn, $event)">{{btn.caption}}</button>
      }
    </div>`,
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
// tslint:disable-next-line:component-class-suffix
export class BSModalFooter {
  constructor(public dialog: DialogRef<MessageModalPreset>) {
  }

  onClick(btn: BSMessageModalButtonConfig, $event: MouseEvent) {
    $event.stopPropagation();
    btn.onClick(this, $event);
  }
}

/**
 * A Component representing a generic bootstrap modal content element.
 *
 * By configuring a MessageModalContext instance you can:
 *
 *  Header:
 *      - Set header container class (default: modal-header)
 *      - Set title text (enclosed in H3 element)
 *      - Set title html (overrides text)
 *
 *  Body:
 *      - Set body container class.  (default: modal-body)
 *      - Set body container HTML.
 *
 *  Footer:
 *      - Set footer class.  (default: modal-footer)
 *      - Set button configuration (from 0 to n)
 */
@Component({
    // tslint:disable-next-line:component-selector
    selector: 'modal-content',
    encapsulation: ViewEncapsulation.None,
    template: `<modal-title></modal-title><modal-body></modal-body><modal-footer></modal-footer>`,
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
// tslint:disable-next-line:component-class-suffix
export class BSMessageModal implements ModalComponent<MessageModalPreset> {
  constructor(public dialog: DialogRef<MessageModalPreset>) {
  }
}
