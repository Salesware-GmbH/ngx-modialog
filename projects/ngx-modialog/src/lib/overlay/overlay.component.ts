declare const clearTimeout: any;

import {
  Component,
  ComponentRef,
  ElementRef,
  EmbeddedViewRef,
  Injector,
  ViewChild,
  ViewContainerRef,
  ViewEncapsulation,
  Renderer2,
  TemplateRef, HostListener
} from '@angular/core';

import { PromiseCompleter, supportsKey } from '../framework/utils';
import { DialogRef } from '../models/dialog-ref';
import { ContainerContent } from '../models/tokens';
import { BaseDynamicComponent } from '../components/index';

// TODO: use DI factory for this.
// TODO: consolidate dup code
const isDoc: boolean = !(typeof document === 'undefined' || !document);

export interface EmbedComponentConfig {
  component: any;
  projectableNodes?: any[][];
}

/**
 * Represents the modal overlay.
 */
@Component({
    // tslint:disable-next-line:component-selector
    selector: 'modal-overlay',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './overlay.component.html',
    standalone: false
})
// tslint:disable-next-line:component-class-suffix
export class ModalOverlay extends BaseDynamicComponent {
  private beforeDestroyHandlers: Array<() => Promise<void>>;

  @ViewChild('container', {read: ElementRef, static: true}) public container: ElementRef;
  @ViewChild('innerView', {read: ViewContainerRef, static: true }) public innerVcr: ViewContainerRef;
  @ViewChild('template', { static: true }) public template: TemplateRef<any>;

  constructor(private dialogRef: DialogRef<any>,
              private vcr: ViewContainerRef,
              el: ElementRef,
              renderer: Renderer2) {
    super(el, renderer);
    this.activateAnimationListener();
  }

  /**
   * @internal
   */
  getProjectables<T>(content: ContainerContent): any[][] {

    let nodes: any[];
    if (typeof content === 'string') {
      nodes = [[this.renderer.createText(`${content}`)]];
    } else if (content instanceof TemplateRef) {
      nodes = [this.vcr.createEmbeddedView(content, {$implicit: this.dialogRef.context, dialogRef: this.dialogRef}).rootNodes];
    } else {
      nodes = [this.embedComponent({component: content}).rootNodes];
    }

    return nodes;
  }

  embedComponent(config: EmbedComponentConfig): EmbeddedViewRef<EmbedComponentConfig> {
    const ctx: EmbedComponentConfig & { injector: Injector } = <any>config;

    return this.vcr.createEmbeddedView(this.template, <any>{
      $implicit: ctx
    });
  }

  addComponent<T>(type: any, projectableNodes: any[][] = []): ComponentRef<T> {
    return super._addComponent<T>({
      component: type,
      vcRef: this.innerVcr,
      projectableNodes
    });
  }

  fullscreen(): void {
    const style = {
      position: 'fixed',
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      'z-index': 1500
    };
    Object.keys(style).forEach(k => this.setStyle(k, style[k]));
  }

  insideElement(): void {
    const style = {
      position: 'absolute',
      overflow: 'hidden',
      width: '100%',
      height: '100%',
      top: 0,
      left: 0,
      bottom: 0,
      right: 0
    };
    Object.keys(style).forEach(k => this.setStyle(k, style[k]));
  }

  /**
   * Set a specific inline style for the container of the whole dialog component
   * The dialog component root element is the host of this component, it contains only 1 direct
   * child which is the container.
   *
   * Structure:
   *
   * ```html
   * <modal-overlay>
   *   <div>
   *     <!-- BACKDROP ELEMENT -->
   *     <!-- DIALOG CONTAINER ELEMENT -->
   *   </div>
   * </modal-overlay>
   * ```
   *
   * @param prop The style key
   * @param value The value, undefined to remove
   */
  setContainerStyle(prop: string, value: string): this {
    this.renderer.setStyle(this.container.nativeElement, prop, value);
    return this;
  }

  /**
   * Define an element that click inside it will not trigger modal close.
   * Since events bubble, clicking on a dialog will bubble up to the overlay, a plugin
   * must define an element that represent the dialog, the overlay will make sure no to close when
   * it was clicked.
   * @param element
   */
  setClickBoundary(element: Element): void {
    let target: Element;
    const elListener = event => target = event.target as any;
    const docListener = event => {
      if (this.dialogRef.context.isBlocking || !this.dialogRef.overlay.isTopMost(this.dialogRef)) {
        return;
      }

      let current: any = event.target;

      // on click, this will hit.
      if (current === target) {
        return;
      }

      // on mouse down -> drag -> release the current might not be 'target', it might be
      // a sibling or a child (i.e: not part of the tree-up direction). It might also be a release
      // outside the dialog... so we compare to the boundary element
      do {
        if (current === element) {
          return;
        }
      } while (current.parentNode && (current = current.parentNode));
      this.dialogRef.dismiss();
    };

    if (isDoc) {
      this.dialogRef.onDestroy.subscribe(() => {
        element.removeEventListener('click', elListener, false);
        element.removeEventListener('touchstart', elListener, false);
        document.removeEventListener('click', docListener, false);
        document.removeEventListener('touchend', docListener, false);
      });


      setTimeout(() => {
        element.addEventListener('mousedown', elListener, false);
        element.addEventListener('touchstart', docListener, false);
        document.addEventListener('click', docListener, false);
        document.addEventListener('touchend', docListener, false);
      });
    }
  }

  /**
   * Temp workaround for animation where destruction of the top level component does not
   * trigger child animations. Solution should be found either in animation module or in design
   * of the modal component tree.
   */
  canDestroy(): Promise<void> {
    const completer = new PromiseCompleter<void>();

    if (!Array.isArray(this.beforeDestroyHandlers)) {
      completer.resolve();
    } else {

      // run destroy notification but protect against halt.
      let id = setTimeout(() => {
        id = null;
        completer.reject();
      }, 1000);

      const resolve = () => {
        if (id === null) {
          return;
        }

        clearTimeout(id);
        completer.resolve();
      };

      Promise.all(this.beforeDestroyHandlers.map(fn => fn()))
        .then(resolve)
        .catch(resolve);

    }

    return completer.promise;
  }

  /**
   * A handler running before destruction of the overlay
   * use to delay destruction due to animation.
   * This is part of the workaround for animation, see canDestroy.
   *
   * NOTE: There is no guarantee that the listeners will fire, use dialog.onDestory for that.
   * @param fn
   */
  beforeDestroy(fn: () => Promise<void>) {
    if (!this.beforeDestroyHandlers) {
      this.beforeDestroyHandlers = [];
    }
    this.beforeDestroyHandlers.push(fn);
  }

  @HostListener('body:keydown', ['$event'])
  documentKeypress(event: KeyboardEvent) {
    // check that this modal is the last in the stack.
    if (!this.dialogRef.overlay.isTopMost(this.dialogRef)) {
      return;
    }


    if (supportsKey(event.keyCode, <any>this.dialogRef.context.keyboard)) {
      this.dialogRef.dismiss();
    }
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    if (this.dialogRef.destroyed !== true) {
      // if we're here the overlay is destroyed by an external event that is not user invoked.
      // i.e: The user did no call dismiss or close and dialogRef.destroy() did not invoke.
      // this will happen when routing or killing an element containing a blocked overlay (ngIf)
      // we bail out, i.e gracefully shutting down.
      this.dialogRef.bailOut();
    }
  }
}
