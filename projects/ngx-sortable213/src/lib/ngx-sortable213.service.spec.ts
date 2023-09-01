import { TestBed } from '@angular/core/testing';
import { NgxSortable2Service } from './ngx-sortable213.service';

describe('NgxSortable2Service', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: NgxSortable2Service = TestBed.inject(NgxSortable2Service);
    expect(service).toBeTruthy();
  });
});
