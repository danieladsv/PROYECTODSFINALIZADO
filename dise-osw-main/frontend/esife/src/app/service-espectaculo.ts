import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ServiceEspectaculo {

  private readonly baseUrl = 'http://localhost:8080';

  constructor(private http: HttpClient) { }

  getEscenarios() {
    return this.http.get(`${this.baseUrl}/busqueda/getEscenarios`);
  }

  getEspectaculos(escenario: any) {
    return this.http.get(
      `${this.baseUrl}/busqueda/getEspectaculos/${escenario.id}`
    );
  }

  getNumeroDeEntradas(espectaculo: any) {
    return this.http.get(
      `${this.baseUrl}/busqueda/getNumeroDeEntradas?espectaculoId=${espectaculo.id}`
    );
  }

  getEntradasLibres(espectaculo: any) {
    return this.http.get(
      `${this.baseUrl}/busqueda/getEntradasLibres?espectaculoId=${espectaculo.id}`
    );
  }

  getNumeroDeEntradasComoDto(espectaculo: any) {
    return this.http.get(
      `${this.baseUrl}/busqueda/getNumeroDeEntradasComoDto?espectaculoId=${espectaculo.id}`
    );
  }

  getEspectaculosPorArtista(artista: string) {
    const a = encodeURIComponent(artista);

    return this.http.get<any[]>(
      `${this.baseUrl}/busqueda/getEspectaculosPorArtista/${a}`
    );
  }

  getEspectaculosPorFecha(fecha: string) {
    return this.http.get<any[]>(
      `${this.baseUrl}/busqueda/getEspectaculosPorFecha?fecha=${fecha}`
    );
  }

  getEntradasDisponibles(espectaculoId: number) {
    return this.http.get<any[]>(
      `${this.baseUrl}/busqueda/getEntradasDisponibles?espectaculoId=${espectaculoId}`
    );
  }

  reservarEntrada(idEntrada: number, tokenCola?: string) {
    const headers = tokenCola
      ? new HttpHeaders({ 'X-Cola-Token': tokenCola })
      : new HttpHeaders();

    return this.http.put(
      `${this.baseUrl}/reservas/reservar?idEntrada=${idEntrada}`,
      {},
      {
        headers,
        responseType: 'text'
      }
    );
  }

  comprar(
    tokenEntrada: string,
    tokenUsuario: string,
    espectaculoId: number,
    tokenCola?: string
  ) {
    const headers = tokenCola
      ? new HttpHeaders({ 'X-Cola-Token': tokenCola })
      : new HttpHeaders();

    const url =
      `${this.baseUrl}/compras/comprar` +
      `?tokenEntrada=${encodeURIComponent(tokenEntrada)}` +
      `&tokenUsuario=${encodeURIComponent(tokenUsuario)}` +
      `&espectaculoId=${espectaculoId}`;

    return this.http.post(
      url,
      {},
      {
        headers,
        responseType: 'text'
      }
    );
  }
}