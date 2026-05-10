import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CarritoService {

  private carritoSubject = new BehaviorSubject<any[]>([]);
  carrito$ = this.carritoSubject.asObservable();

  agregar(e: any) {
    const carritoActual = this.carritoSubject.getValue();
    this.carritoSubject.next([...carritoActual, e]);
    console.log(this.carritoSubject.getValue());
  }

  obtener() {
    return this.carritoSubject.getValue();
  }

  totalItems() {
    return this.carritoSubject.getValue().length;
  }

  limpiar() {
    this.carritoSubject.next([]);
  }
}