import {
  Directive,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  Renderer2,
  SimpleChange,
} from '@angular/core';
import Sortable, { Options, SortableEvent } from 'sortablejs';
import { SortablejsBindings } from './ngx-sortable213-bindings';
import { NgxSortable2Service } from './ngx-sortable213.service';
import { CloneFunction, SortableData } from './ngx-sortable213.types';
import { GLOBALS } from './globals';

const getIndexesFromEvent = (event: SortableEvent) => {
  if (
    event.hasOwnProperty('newDraggableIndex') &&
    event.hasOwnProperty('oldDraggableIndex')
  ) {
    return {
      new: event.newDraggableIndex,
      old: event.oldDraggableIndex,
    };
  } else {
    return {
      new: event.newIndex,
      old: event.oldIndex,
    };
  }
};

@Directive({
  selector: '[sortable]',
})
export class NgxSortable2Directive<T> implements OnInit, OnChanges, OnDestroy {
  /** Input data, can be Array or FormArray */
  @Input('sortable')
  data?: SortableData;

  /**
   * CSS selector for the sortable container
   *
   * Mostly required when used with custom components which wrap items in multiple containers. In that case,
   * this should be the selector for the direct HTML parent of sortable items.
   */
  @Input()
  sortable2Container?: string;

  /** Sortablejs configuration */
  @Input()
  sortable2Options?: Options;

  /** A function invoked when cloning items from template dataset into target dataset */
  @Input()
  sortable2CloneFunction?: CloneFunction<T>;

  @Output() readonly sortable2Init = new EventEmitter<Sortable>();

  private sortableInstance?: Sortable;

  constructor(
    @Optional()
    @Inject(GLOBALS)
    private globalConfig: Options | undefined,
    private service: NgxSortable2Service,
    private element: ElementRef,
    private zone: NgZone,
    private renderer: Renderer2
  ) {}

  ngOnInit() {
    if (Sortable?.create!) {
      // Sortable does not exist in angular universal (SSR)
      this.create();
    }
  }

  ngOnChanges(changes: {
    [prop in keyof NgxSortable2Directive<T>]: SimpleChange;
  }) {
    const optionsChange = changes.sortable2Options;

    if (optionsChange && !optionsChange.isFirstChange()) {
      const previousOptions: Options = optionsChange.previousValue;
      const currentOptions: Options = optionsChange.currentValue;

      Object.keys(currentOptions).forEach((optionName) => {
        if (
          currentOptions[optionName as keyof Options] !==
          previousOptions[optionName as keyof Options]
        ) {
          // use low-level option setter
          this.sortableInstance?.option(
            optionName as keyof Options,
            this.options[optionName as keyof Options]
          );
        }
      });
    }
  }

  ngOnDestroy() {
    if (this.sortableInstance) {
      this.sortableInstance.destroy();
    }
  }

  private create() {
    const container = this.sortable2Container
      ? this.element.nativeElement.querySelector(this.sortable2Container)
      : this.element.nativeElement;

    setTimeout(() => {
      this.sortableInstance = Sortable.create(container, this.options);
      this.sortable2Init.emit(this.sortableInstance);
    }, 0);
  }

  private getBindings(): SortablejsBindings<T> {
    if (!this.data) {
      return new SortablejsBindings([]);
    } else if (this.data instanceof SortablejsBindings) {
      return this.data;
    } else {
      return new SortablejsBindings([this.data]);
    }
  }

  private get options() {
    return { ...this.optionsWithoutEvents, ...this.overridenOptions };
  }

  private get optionsWithoutEvents() {
    return { ...(this.globalConfig ?? {}), ...(this.sortable2Options ?? {}) };
  }

  private proxyEvent(eventName: string, ...params: any[]) {
    this.zone.run(() => {
      // re-entering zone, see https://github.com/SortableJS/angular-sortablejs/issues/110#issuecomment-408874600
      if (
        this.optionsWithoutEvents?.[
          eventName as keyof typeof this.optionsWithoutEvents
        ]
      ) {
        (
          this.optionsWithoutEvents[
            eventName as keyof typeof this.optionsWithoutEvents
          ] as (...params: any[]) => void
        )(...params);
      }
    });
  }

  private get isCloning() {
    const groupOptions = this.sortableInstance?.options.group;
    return groupOptions && typeof groupOptions != 'string'
      ? groupOptions.checkPull?.(
          this.sortableInstance!,
          this.sortableInstance!,
          null as any,
          null as any
        ) === 'clone'
      : groupOptions === 'clone';
  }

  private clone(item: T): T {
    // by default pass the item through, no cloning performed
    return (this.sortable2CloneFunction ?? ((subitem) => subitem))(item);
  }

  private get overridenOptions(): Options {
    // always intercept standard events but act only in case items are set (bindingEnabled)
    // allows to forget about tracking this.items changes
    return {
      onAdd: (event: SortableEvent) => {
        this.service.transfer = (items: any[]) => {
          this.getBindings().injectIntoEvery(event.newIndex!, items);
          this.proxyEvent('onAdd', event);
        };

        this.proxyEvent('onAddOriginal', event);
      },
      onRemove: (event: SortableEvent) => {
        const bindings = this.getBindings();

        if (bindings.provided) {
          if (this.isCloning) {
            this.service.transfer?.(
              bindings
                .getFromEvery(event.oldIndex!)
                .map((item) => this.clone(item))
            );

            // great thanks to https://github.com/tauu
            // event.item is the original item from the source list which is moved to the target list
            // event.clone is a clone of the original item and will be added to source list
            // If bindings are provided, adding the item dom element to the target list causes artifacts
            // as it interferes with the rendering performed by the angular template.
            // Therefore we remove it immediately and also move the original item back to the source list.
            // (event handler may be attached to the original item and not its clone, therefore keeping
            // the original dom node, circumvents side effects )
            this.renderer.removeChild(event.item.parentNode, event.item);
            this.renderer.insertBefore(
              event.clone.parentNode,
              event.item,
              event.clone
            );
            this.renderer.removeChild(event.clone.parentNode, event.clone);
          } else {
            this.service.transfer?.(bindings.extractFromEvery(event.oldIndex!));
          }

          this.service.transfer = undefined;
        }

        this.proxyEvent('onRemove', event);
      },
      onUpdate: (event: SortableEvent) => {
        const bindings = this.getBindings();
        const indexes = getIndexesFromEvent(event);

        bindings.injectIntoEvery(
          indexes.new!,
          bindings.extractFromEvery(indexes.old!)
        );
        this.proxyEvent('onUpdate', event);
      },
    };
  }
}
