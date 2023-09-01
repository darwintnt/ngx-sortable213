import { Component } from '@angular/core';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { NgxSortable2Module } from './ngx-sortable213.module';

describe('NgxSortable2Component', () => {
  @Component({
    template: `
      <div [sortable]="items">
        <div *ngFor="let item of items">{{ item }}</div>
      </div>
    `,
  })
  class TestComponent1 {
    items = [1, 2, 3, 4, 5];
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [TestComponent1],
      imports: [NgxSortable2Module],
    }).compileComponents();
  }));

  it('should create', () => {
    const fixture = TestBed.createComponent(TestComponent1);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });
});
