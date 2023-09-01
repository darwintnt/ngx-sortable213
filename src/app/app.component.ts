import { Component } from '@angular/core';
import { Options } from 'sortablejs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'library13';

  cloneList1 = [
    '1',
    '2',
    '3',
    '4',
    '5',
  ];

  cloneList2 = [
    '6',
    '7',
    '8',
    '9',
    '10',
  ];

  clone1Options: Options = {
    group: {
      name: 'clone-group',
      pull: 'clone',
      put: false,
    },
  };

  clone2Options: Options = {
    group: 'clone-group',
  };
}
