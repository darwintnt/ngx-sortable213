import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgxSortable2Module } from 'ngx-sortable213';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgxSortable2Module.forRoot({
      animation: 200,
    }),
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
