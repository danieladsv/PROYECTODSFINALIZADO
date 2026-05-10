import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComponentEntradas } from './component-entradas';

describe('ComponentEntradas', () => {
  let component: ComponentEntradas;
  let fixture: ComponentFixture<ComponentEntradas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComponentEntradas],
    }).compileComponents();

    fixture = TestBed.createComponent(ComponentEntradas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
