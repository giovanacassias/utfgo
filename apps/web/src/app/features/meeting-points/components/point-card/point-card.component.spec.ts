import { TestBed } from '@angular/core/testing';

import { MeetingPoint } from '../../models/meeting-point.model';
import { PointCardComponent } from './point-card.component';

const point: MeetingPoint = {
  id: 'point-1',
  name: 'Entrada da Biblioteca',
  address: 'Avenida Sete de Setembro, 3165, Rebouças, Curitiba/PR',
  latitude: -25.44,
  longitude: -49.27,
  isActive: true,
  createdAt: '2026-10-02T00:00:00.000Z',
};

describe('PointCardComponent', () => {
  it.each([
    { isActive: true, status: 'Ativo' },
    { isActive: false, status: 'Inativo' },
  ])('renders the meeting point with status $status', ({ isActive, status }) => {
    const fixture = TestBed.createComponent(PointCardComponent);
    fixture.componentRef.setInput('point', { ...point, isActive });
    fixture.detectChanges();

    const card = fixture.nativeElement as HTMLElement;
    expect(card.textContent).toContain('Entrada da Biblioteca');
    expect(card.textContent).toContain('Avenida Sete de Setembro, 3165, Rebouças, Curitiba/PR');
    expect(card.textContent).toContain(status);
  });

  it('emits the point ID when its status action is clicked', () => {
    const fixture = TestBed.createComponent(PointCardComponent);
    fixture.componentRef.setInput('point', point);
    fixture.detectChanges();

    const emittedIds: string[] = [];
    fixture.componentInstance.toggleStatus.subscribe((id) => emittedIds.push(id));

    const card = fixture.nativeElement as HTMLElement;
    card.querySelector('button')?.click();

    expect(emittedIds).toEqual(['point-1']);
  });
});
