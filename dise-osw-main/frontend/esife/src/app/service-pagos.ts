import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ServicePagos {

  private readonly baseUrl = 'http://localhost:8080';

  constructor(private http: HttpClient) { }

  prepararPago(info: any) {
    return this.http.post(
      `${this.baseUrl}/pagos/preparar`,
      info,
      { responseType: 'text' }
    );
  }
}