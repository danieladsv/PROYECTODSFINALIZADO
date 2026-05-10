import { TestBed } from '@angular/core/testing';

import { ServiceCola } from './service-cola';

describe('ServiceCola', () => {
  let service: ServiceCola;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServiceCola);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
