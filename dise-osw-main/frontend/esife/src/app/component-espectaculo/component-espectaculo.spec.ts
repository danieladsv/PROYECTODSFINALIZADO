import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComponentEspectaculo } from './component-espectaculo';

describe('ComponentEspectaculo', () => {
  let component: ComponentEspectaculo;
  let fixture: ComponentFixture<ComponentEspectaculo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComponentEspectaculo],
    }).compileComponents();

    fixture = TestBed.createComponent(ComponentEspectaculo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
