import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { PointSearchComponent } from './point-search.component';

@Component({
  imports: [PointSearchComponent],
  template: `<app-point-search [(searchTerm)]="term" [(onlyActive)]="active" />`,
})
class PointSearchHost {
  readonly term = signal('Biblioteca');
  readonly active = signal(true);
}

describe('PointSearchComponent', () => {
  it('synchronizes the search term between the parent and the search field', async () => {
    const fixture = TestBed.createComponent(PointSearchHost);
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    const search = host.querySelector<HTMLInputElement>('input[type="search"]');
    expect(search?.value).toBe('Biblioteca');

    fixture.componentInstance.term.set('Portaria');
    await fixture.whenStable();
    expect(search!.value).toBe('Portaria');

    search!.value = 'Refeitório';
    search!.dispatchEvent(new Event('input'));

    expect(fixture.componentInstance.term()).toBe('Refeitório');
  });

  it('synchronizes the active filter between the parent and the checkbox', async () => {
    const fixture = TestBed.createComponent(PointSearchHost);
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    const checkbox = host.querySelector<HTMLInputElement>('input[type="checkbox"]');
    expect(checkbox?.checked).toBe(true);

    fixture.componentInstance.active.set(false);
    await fixture.whenStable();
    expect(checkbox!.checked).toBe(false);

    checkbox!.click();

    expect(fixture.componentInstance.active()).toBe(true);
  });
});
