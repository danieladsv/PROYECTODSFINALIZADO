import { TestBed } from '@angular/core/testing';

import { ServiceEspectaculo } from './service-espectaculo';

describe('ServiceEspectaculo', () => {
  let service: ServiceEspectaculo;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServiceEspectaculo);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
