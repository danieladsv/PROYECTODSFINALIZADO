import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timer } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';

export type EstadoCola =
  | 'ESPERANDO'
  | 'TURNO'
  | 'EXPIRADO'
  | 'FUERA_COLA'
  | 'CERRADA';

export interface DtoCola {
  tokenCola: string;
  estado: EstadoCola;
  personasDelante: number;
  segundosRestantesTurno?: number;
  mensaje?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ServiceCola {

  private readonly baseUrl = 'http://localhost:8080/cola';

  constructor(private http: HttpClient) { }

  entrar(espectaculoId: number): Observable<DtoCola> {
    return this.http.post<DtoCola>(
      `${this.baseUrl}/entrar/${espectaculoId}`,
      {}
    );
  }

  estado(tokenCola: string): Observable<DtoCola> {
    return this.http.get<DtoCola>(
      `${this.baseUrl}/estado/${tokenCola}`
    );
  }

  estadoPeriodico(tokenCola: string): Observable<DtoCola> {
    return timer(0, 3000).pipe(
      switchMap(() => this.estado(tokenCola)),

      // Ahora sigue consultando mientras esté ESPERANDO o en TURNO.
      takeWhile(
        respuesta =>
          respuesta.estado === 'ESPERANDO' ||
          respuesta.estado === 'TURNO',
        true
      )
    );
  }

  salir(tokenCola: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/salir/${tokenCola}`
    );
  }
}