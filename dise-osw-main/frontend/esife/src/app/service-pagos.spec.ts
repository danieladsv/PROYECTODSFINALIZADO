import { TestBed } from '@angular/core/testing';

import { ServicePagos } from './service-pagos';

describe('ServicePagos', () => {
  let service: ServicePagos;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServicePagos);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
