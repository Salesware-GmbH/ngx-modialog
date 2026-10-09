import {
  ComponentRef,
  EnvironmentInjector,
  Injector,
  ViewContainerRef,
  createComponent as ngCreateComponent
} from '@angular/core';

export interface CreateComponentArgs {
  component: any;
  vcRef: ViewContainerRef;
  injector?: Injector;
  projectableNodes?: any[][];
}

export function createComponent(instructions: CreateComponentArgs): ComponentRef<any> {
  if (instructions.vcRef) {
    const injector: Injector = instructions.injector || instructions.vcRef.injector;

    return instructions.vcRef.createComponent(instructions.component, {
      index: instructions.vcRef.length,
      injector,
      projectableNodes: instructions.projectableNodes
    });
  }

  // No view container (e.g. body-attached modal): create a free-standing component.
  // The caller attaches its host element to the DOM and registers the view via ApplicationRef.
  const elementInjector: Injector = instructions.injector;

  return ngCreateComponent(instructions.component, {
    environmentInjector: elementInjector.get(EnvironmentInjector),
    elementInjector,
    projectableNodes: instructions.projectableNodes
  });
}
