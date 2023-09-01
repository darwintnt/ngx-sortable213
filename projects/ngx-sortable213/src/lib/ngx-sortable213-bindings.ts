import { SortablejsBinding } from './ngx-sortable213-binding';
import { SortableData } from './ngx-sortable213.types';


export class SortablejsBindings<T> {
  bindings: Array<SortablejsBinding<T>>;

  constructor(bindingTargets: Array<SortableData>) {
    this.bindings = bindingTargets.map(
      (target) => new SortablejsBinding<T>(target)
    );
  }

  injectIntoEvery(index: number, items: any[]) {
    this.bindings.forEach((b, i) => b.insert(index, items[i]));
  }

  getFromEvery(index: number) {
    return this.bindings.map((b) => b.get(index));
  }

  extractFromEvery(index: number) {
    return this.bindings.map((b) => b.remove(index));
  }

  get provided() {
    return !!this.bindings.length;
  }
}
