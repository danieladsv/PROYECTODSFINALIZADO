import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription, forkJoin } from 'rxjs';

import { ServiceEspectaculo } from '../service-espectaculo';
import { ServicePagos } from '../service-pagos';
import { CarritoService } from '../service-carrito';
import { ServiceCola, DtoCola } from '../service-cola';

declare let Stripe: any;

@Component({
  selector: 'app-component-entradas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './component-entradas.html',
  styleUrl: './component-entradas.css'
})
export class ComponentEntradas implements OnDestroy {

  espectaculo: any = {};
  entradas: any = null;
  entradasDisponibles: any[] = [];

  clientSecret?: string;
  tokenEntrada?: string;

  stripe = Stripe('pk_test_51T4n7K205klxN2ZJ7oLZj2qyk0wN3xtpk05QhO1e0a4dXWCqAU4nvQ7fJ9YXVeKd31o29x9osIo4xZSk42zr8gn700X4HnCgiV');

  carrito: any[] = [];
  tokenUsuario = '';

  espectaculoId!: number;

  tokenCola = '';
  estadoCola: DtoCola | null = null;

  esperandoCola = false;
  esTuTurno = false;
  cargandoCola = false;
  mensajeCola = '';

  entradasCargadas = false;

  private colaSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private service: ServiceEspectaculo,
    private pagosService: ServicePagos,
    private carritoService: CarritoService,
    private colaService: ServiceCola
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.espectaculo = params;

      const id = Number(params['id']);
      this.espectaculoId = id;

      this.tokenUsuario =
        localStorage.getItem('tokenUsuario') ??
        sessionStorage.getItem('tokenUsuario') ??
        '';

      this.carrito = this.carritoService.obtener();

      this.recuperarColaGuardada();
    });
  }

  unirseACola() {
    if (!this.espectaculoId) {
      alert('No se ha encontrado el espectáculo');
      return;
    }

    this.cargandoCola = true;
    this.mensajeCola = 'Entrando en la cola...';

    this.colaService.entrar(this.espectaculoId).subscribe({
      next: (respuesta: DtoCola) => {
        this.tokenCola = respuesta.tokenCola;

        if (!this.tokenCola) {
          this.cargandoCola = false;
          this.mensajeCola = 'El backend no ha devuelto token de cola.';
          return;
        }

        sessionStorage.setItem(this.claveCola(), this.tokenCola);

        this.aplicarEstadoCola(respuesta);
        this.iniciarConsultaPeriodicaCola();
      },
      error: (err) => {
        console.error('Error al entrar en cola', err);
        this.cargandoCola = false;
        this.mensajeCola = 'No se ha podido entrar en la cola.';
      }
    });
  }

  salirDeCola() {
    if (!this.tokenCola) {
      this.limpiarCola();
      return;
    }

    const tokenColaActual = this.tokenCola;

    this.colaService.salir(tokenColaActual).subscribe({
      next: () => {
        this.limpiarCola();
      },
      error: (err) => {
        console.error('Error al salir de cola', err);
        this.mensajeCola = 'No se ha podido salir de la cola.';
      }
    });
  }

  agregarAlCarrito(e: any) {
    if (!this.esTuTurno) {
      alert('Todavía no es tu turno.');
      return;
    }

    if (!this.tokenCola) {
      alert('No hay token de cola. Vuelve a entrar en la cola.');
      return;
    }

    console.log('CLICK EN AÑADIR - Entrada:', e);

    this.service.reservarEntrada(e.id, this.tokenCola)
      .subscribe({
        next: (token: any) => {
          console.log('TOKEN RECIBIDO:', token);

          e.token = token;
          e.espectaculoId = this.espectaculoId;
          e.estado = 'RESERVADA';
          e.artista = this.espectaculo.artista;

          this.carritoService.agregar(e);
          this.carrito = this.carritoService.obtener();

          console.log('CARRITO ACTUALIZADO:', this.carrito);
        },
        error: (err: any) => {
          console.error('ERROR AL RESERVAR:', err);
          alert(`Error: ${err.error || err.message || 'Error desconocido'}`);
        }
      });
  }

  pagarCarrito() {
    const tokenUsuario =
      localStorage.getItem('tokenUsuario') ??
      sessionStorage.getItem('tokenUsuario');

    if (!tokenUsuario) {
      alert('Debes iniciar sesión primero');
      return;
    }

    const carrito = this.carritoService.obtener();

    if (carrito.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    if (!this.tokenCola) {
      alert('No hay token de cola. Vuelve a entrar en la cola.');
      return;
    }

    const tokenColaComprado = this.tokenCola;

    console.log('TOKEN COLA ENVIADO AL COMPRAR:', tokenColaComprado);

    const compras$ = carrito.map((e: any) =>
      this.service.comprar(
        e.token,
        tokenUsuario,
        this.espectaculoId,
        tokenColaComprado
      )
    );

    forkJoin(compras$).subscribe({
      next: () => {
        alert('Compra realizada correctamente');

        this.carritoService.limpiar();
        this.carrito = [];

        /*
          Importante:
          Aunque el backend debería sacar al usuario de la cola al comprar,
          hacemos también esta llamada para garantizar que el turno queda libre
          y pueda pasar el siguiente usuario.
        */
        this.colaService.salir(tokenColaComprado).subscribe({
          next: () => {
            this.limpiarCola();
            this.mensajeCola = 'Compra realizada. Has salido de la cola.';
          },
          error: (err) => {
            console.error('La compra se hizo, pero hubo error al salir de la cola:', err);

            this.limpiarCola();
            this.mensajeCola = 'Compra realizada. Has salido de la cola.';
          }
        });
      },
      error: (err) => {
        console.error('Error comprando carrito', err);
        alert('No se ha podido completar la compra.');
      }
    });
  }

  comprarEntrada(e: any) {
    if (!this.esTuTurno) {
      alert('Todavía no es tu turno.');
      return;
    }

    if (!this.tokenCola) {
      alert('No hay token de cola. Vuelve a entrar en la cola.');
      return;
    }

    this.service.reservarEntrada(e.id, this.tokenCola).subscribe({
      next: (token: any) => {
        this.tokenEntrada = token;
        e.espectaculoId = this.espectaculoId;

        this.pagosService.prepararPago({
          entradaId: e.id
        }).subscribe({
          next: (clientSecret: any) => {
            this.clientSecret = clientSecret;
            this.mostrarFormularioStripe();
          },
          error: (err) => {
            console.error('Error preparando pago', err);
            alert('No se ha podido preparar el pago.');
          }
        });
      },
      error: (err) => {
        console.error('Error reservando entrada', err);
        alert('No se ha podido reservar la entrada.');
      }
    });
  }

  confirmarCompra() {
    const tokenUsuario =
      localStorage.getItem('tokenUsuario') ??
      sessionStorage.getItem('tokenUsuario');

    if (!tokenUsuario) {
      alert('Debes iniciar sesión primero');
      return;
    }

    if (!this.tokenEntrada) {
      alert('No hay token de entrada.');
      return;
    }

    if (!this.tokenCola) {
      alert('No hay token de cola. Vuelve a entrar en la cola.');
      return;
    }

    const tokenColaComprado = this.tokenCola;

    console.log('TOKEN COLA ENVIADO AL CONFIRMAR COMPRA:', tokenColaComprado);

    this.service.comprar(
      this.tokenEntrada,
      tokenUsuario,
      this.espectaculoId,
      tokenColaComprado
    ).subscribe({
      next: () => {
        alert('Compra realizada');

        this.carritoService.limpiar();
        this.carrito = [];

        /*
          Esto libera la cola automáticamente después de compra individual.
        */
        this.colaService.salir(tokenColaComprado).subscribe({
          next: () => {
            this.limpiarCola();
            this.mensajeCola = 'Compra realizada. Has salido de la cola.';
          },
          error: (err) => {
            console.error('La compra se hizo, pero hubo error al salir de la cola:', err);

            this.limpiarCola();
            this.mensajeCola = 'Compra realizada. Has salido de la cola.';
          }
        });
      },
      error: (err) => {
        console.error('Error confirmando compra', err);
        alert('No se ha podido confirmar la compra.');
      }
    });
  }

  mostrarFormularioStripe() {
    const elements = this.stripe.elements();

    const card = elements.create('card');
    card.mount('#card-element');

    const form = document.getElementById('payment-form');

    form!.addEventListener('submit', (event) => {
      event.preventDefault();

      this.stripe.confirmCardPayment(this.clientSecret, {
        payment_method: {
          card: card
        }
      }).then((result: any) => {
        if (result.error) {
          alert('Error en el pago');
        } else {
          if (result.paymentIntent.status === 'succeeded') {
            this.confirmarCompra();
          }
        }
      });
    });

    form!.style.display = 'block';
  }

  seleccionarEntrada(e: any) {
    alert('Entrada seleccionada: ' + e.id);
  }

  private recuperarColaGuardada() {
    const tokenGuardado = sessionStorage.getItem(this.claveCola());

    if (!tokenGuardado) {
      return;
    }

    this.tokenCola = tokenGuardado;
    this.iniciarConsultaPeriodicaCola();
  }

  private iniciarConsultaPeriodicaCola() {
    if (!this.tokenCola) {
      return;
    }

    this.colaSub?.unsubscribe();

    this.colaSub = this.colaService.estadoPeriodico(this.tokenCola).subscribe({
      next: (respuesta: DtoCola) => {
        this.aplicarEstadoCola(respuesta);
      },
      error: (err) => {
        console.error('Error consultando cola', err);
        this.mensajeCola = 'No se ha podido consultar la cola.';
      }
    });
  }

  private aplicarEstadoCola(respuesta: DtoCola) {
    this.cargandoCola = false;
    this.estadoCola = respuesta;

    if (respuesta.estado === 'ESPERANDO') {
      this.esperandoCola = true;
      this.esTuTurno = false;
      this.mensajeCola = respuesta.mensaje || 'Estás esperando en la cola.';
      return;
    }

    if (respuesta.estado === 'TURNO') {
      this.esperandoCola = false;
      this.esTuTurno = true;
      this.mensajeCola = respuesta.mensaje || 'Es tu turno. Ya puedes seleccionar entradas.';
      this.cargarEntradasDisponibles();
      return;
    }

    if (
      respuesta.estado === 'EXPIRADO' ||
      respuesta.estado === 'FUERA_COLA' ||
      respuesta.estado === 'CERRADA'
    ) {
      this.esperandoCola = false;
      this.esTuTurno = false;
      this.mensajeCola = respuesta.mensaje || 'Ya no estás en la cola.';
      this.limpiarCola(false);
    }
  }

  private cargarEntradasDisponibles() {
    if (this.entradasCargadas) {
      return;
    }

    this.entradasCargadas = true;

    this.service.getEntradasDisponibles(this.espectaculoId).subscribe({
      next: (res: any[]) => {
        this.entradasDisponibles = res;
      },
      error: (err) => {
        console.error('Error cargando entradas', err);
        this.entradasCargadas = false;
        alert('No se han podido cargar las entradas disponibles.');
      }
    });
  }

  private limpiarCola(borrarMensaje: boolean = true) {
    this.colaSub?.unsubscribe();

    sessionStorage.removeItem(this.claveCola());

    this.tokenCola = '';
    this.estadoCola = null;
    this.esperandoCola = false;
    this.esTuTurno = false;
    this.cargandoCola = false;
    this.entradasDisponibles = [];
    this.entradasCargadas = false;

    if (borrarMensaje) {
      this.mensajeCola = '';
    }
  }

  private claveCola() {
    return `cola_${this.espectaculoId}`;
  }

  ngOnDestroy() {
    this.colaSub?.unsubscribe();
  }
}