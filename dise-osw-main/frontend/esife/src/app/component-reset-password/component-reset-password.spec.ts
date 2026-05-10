import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComponentResetPassword } from './component-reset-password';

describe('ComponentResetPassword', () => {
  let component: ComponentResetPassword;
  let fixture: ComponentFixture<ComponentResetPassword>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComponentResetPassword],
    }).compileComponents();

    fixture = TestBed.createComponent(ComponentResetPassword);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
