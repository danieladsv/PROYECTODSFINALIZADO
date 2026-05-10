import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CarritoService } from './service-carrito';

declare let Stripe: any;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    FormsModule,
    RouterOutlet,
    CommonModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnInit {

  // BUSCADOR
  busqueda: string = '';
  fecha: string = '';

  // MODALES
  mostrarCarrito: boolean = false;
  mostrarRegistro: boolean = false;

  // LOGIN
  usuario: string = "";
  password: string = "";
  tokenUsuario?: string;

  // REGISTRO
  registroNombre: string = "";
  registroEmail: string = "";
  registroPwd1: string = "";
  registroPwd2: string = "";

  registroError: string = "";
  registroOk: string = "";

  // STRIPE
  stripe: any;
  card: any;
  clientSecret: string = "";

  // RECUPERAR CONTRASEÑA
  mostrarRecuperarPassword: boolean = false;
  recuperarEmail: string = "";
  recuperarMensaje: string = "";
  recuperarError: string = "";

  constructor(
    private router: Router,
    public carritoService: CarritoService
  ) { }

  ngOnInit() {

    // 🔥 STRIPE
    this.stripe = Stripe(
      "pk_test_51T4n7K205klxN2ZJ7oLZj2qyk0wN3xtpk05QhO1e0a4dXWCqAU4nvQ7fJ9YXVeKd31o29x9osIo4xZSk42zr8gn700X4HnCgiV"
    );

    // BORRAR TOKEN AL CERRAR
    window.addEventListener('beforeunload', () => {
      sessionStorage.removeItem("tokenUsuario");
    });

  }

  // Extrae mensajes reales del backend
  private obtenerMensajeError(texto: string, mensajePorDefecto: string): string {

    if (!texto || texto.trim() === "") {
      return mensajePorDefecto;
    }

    try {
      const json = JSON.parse(texto);

      if (json.detail && json.detail.trim() !== "") {
        return json.detail;
      }

      if (json.message && json.message.trim() !== "") {
        return json.message;
      }

      if (
        json.error &&
        json.error.trim() !== "" &&
        json.error !== "Bad Request"
      ) {
        return json.error;
      }

      return mensajePorDefecto;

    } catch {
      if (texto.trim() === "Bad Request") {
        return mensajePorDefecto;
      }

      return texto.trim() || mensajePorDefecto;
    }
  }

  // Validación Gmail
  private esEmailGmailValido(email: string): boolean {
    const emailValido = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    return emailValido.test(email.trim());
  }

  // Misma regla de contraseña que en backend
  private esPasswordSegura(password: string): boolean {
    const passwordSegura = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{10,}$/;
    return passwordSegura.test(password);
  }

  // BUSCAR
  buscar() {

    const params: any = {};

    if (this.busqueda && this.busqueda.trim() !== '') {
      params.artista = this.busqueda.trim();
    }

    if (this.fecha && this.fecha.trim() !== '') {
      params.fecha = this.fecha.trim();
    }

    this.router.navigate(['/espectaculo'], { queryParams: params });

  }

  // CARRITO
  abrirCarrito() {
    this.mostrarCarrito = true;
  }

  cerrarCarrito() {
    this.mostrarCarrito = false;
  }

  // LOGIN
  login() {

    sessionStorage.removeItem("tokenUsuario");
    this.tokenUsuario = undefined;

    const email = this.usuario.trim().toLowerCase();

    if (!email || !this.password) {
      alert("Introduce email y contraseña");
      return;
    }

    fetch(
      "http://localhost:8081/users/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email,
          pwd: this.password
        })
      }
    )
      .then(async res => {

        const texto = await res.text();

        if (!res.ok) {
          const mensaje = this.obtenerMensajeError(
            texto,
            "Credenciales incorrectas o cuenta no validada"
          );

          throw new Error(mensaje);
        }

        return texto;
      })
      .then(token => {

        this.tokenUsuario = token;

        sessionStorage.setItem(
          "tokenUsuario",
          token
        );

        alert("Login correcto");

      })
      .catch(error => {

        console.error("Error login:", error);

        sessionStorage.removeItem("tokenUsuario");
        this.tokenUsuario = undefined;

        alert(
          error.message ||
          "Credenciales incorrectas o cuenta no validada"
        );

      });

  }

  // LOGOUT
  logout() {

    sessionStorage.removeItem("tokenUsuario");
    this.tokenUsuario = undefined;

    alert("Sesión cerrada");

  }

  // REGISTRO
  abrirRegistro() {

    this.mostrarRegistro = true;

    this.registroError = "";
    this.registroOk = "";

  }

  cerrarRegistro() {

    this.mostrarRegistro = false;

  }

  registrar() {

    this.registroError = "";
    this.registroOk = "";

    const nombre = this.registroNombre.trim();
    const email = this.registroEmail.trim().toLowerCase();

    if (!nombre || !email || !this.registroPwd1 || !this.registroPwd2) {
      this.registroError = "Rellena todos los campos para crear tu cuenta.";
      return;
    }

    if (!this.esEmailGmailValido(email)) {
      this.registroError = "Introduce un correo válido de Gmail. Ejemplo: usuario@gmail.com";
      return;
    }

    if (this.registroPwd1 !== this.registroPwd2) {
      this.registroError = "Las contraseñas no coinciden.";
      return;
    }

    if (!this.esPasswordSegura(this.registroPwd1)) {
      this.registroError =
        "La contraseña debe tener mínimo 10 caracteres, una mayúscula, una minúscula, un número y un carácter especial.";
      return;
    }

    fetch(
      "http://localhost:8081/users/registrar",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: nombre,
          email: email,
          pwd1: this.registroPwd1,
          pwd2: this.registroPwd2
        })
      }
    )
      .then(async res => {

        const texto = await res.text();

        if (!res.ok) {

          let mensaje = this.obtenerMensajeError(
            texto,
            "No se ha podido crear la cuenta."
          );

          if (res.status === 409) {
            mensaje = "Ya existe una cuenta registrada con ese email.";
          }

          if (res.status === 500) {
            mensaje = "La cuenta se ha creado, pero no se ha podido enviar el email de validación.";
          }

          throw new Error(mensaje);
        }

        return texto;
      })
      .then(data => {

        this.registroOk =
          data ||
          "Cuenta creada correctamente. Revisa tu correo para activarla.";

        this.registroNombre = "";
        this.registroEmail = "";
        this.registroPwd1 = "";
        this.registroPwd2 = "";

        setTimeout(() => {
          this.cerrarRegistro();
          this.registroOk = "";
        }, 2500);

      })
      .catch((error) => {

        console.error("Error registro:", error);

        this.registroError =
          error.message ||
          "No se ha podido crear la cuenta.";

      });

  }

  // PAGAR
  pagarCarrito() {

    const tokenUsuario =
      sessionStorage.getItem("tokenUsuario");

    if (!tokenUsuario) {

      alert("Debes iniciar sesión");
      return;

    }

    const carrito =
      this.carritoService.obtener();

    if (carrito.length === 0) {

      alert("Carrito vacío");
      return;

    }

    const entrada =
      carrito[0];

    fetch(
      "http://localhost:8080/pagos/preparar",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          entradaId: entrada.id
        })
      }
    )
      .then(async res => {

        const texto = await res.text();

        if (!res.ok) {
          throw new Error(
            this.obtenerMensajeError(
              texto,
              "No se ha podido preparar el pago."
            )
          );
        }

        return texto;
      })
      .then(clientSecret => {

        this.clientSecret = clientSecret;
        this.mostrarFormularioStripe();

      })
      .catch(error => {

        console.error("Error preparando pago:", error);

        alert(
          error.message ||
          "No se ha podido preparar el pago."
        );

      });

  }

  // MOSTRAR FORMULARIO
  mostrarFormularioStripe() {

    const elements =
      this.stripe.elements();

    const style = {

      base: {

        color: "#32325d",

        fontFamily:
          "Arial, sans-serif",

        fontSize: "16px",

        "::placeholder": {
          color: "#aab7c4"
        }

      },

      invalid: {
        color: "#fa755a"
      }

    };

    const cardElement =
      document.getElementById("card-element");

    if (cardElement) {
      cardElement.innerHTML = "";
    }

    this.card =
      elements.create(
        "card",
        { style: style }
      );

    this.card.mount("#card-element");

    const form =
      document.getElementById("payment-form");

    if (form) {
      form.style.display = "block";
    }

  }

  // CONFIRMAR PAGO
  confirmarPago() {

    const tokenUsuario =
      sessionStorage.getItem("tokenUsuario");

    if (!tokenUsuario) {

      alert("Debes iniciar sesión");
      return;

    }

    if (!this.clientSecret || !this.card) {
      alert("Primero debes preparar el pago.");
      return;
    }

    this.stripe.confirmCardPayment(
      this.clientSecret,
      {
        payment_method: {
          card: this.card
        }
      }
    )
      .then((result: any) => {

        if (result.error) {

          const cardError =
            document.getElementById("card-error");

          if (cardError) {
            cardError.textContent = result.error.message;
          }

          return;
        }

        if (
          result.paymentIntent &&
          result.paymentIntent.status === "succeeded"
        ) {

          const carrito =
            this.carritoService.obtener();

          carrito.forEach(
            (e: any) => {

              fetch(
                `http://localhost:8080/compras/comprar?tokenEntrada=${e.token}&tokenUsuario=${tokenUsuario}&espectaculoId=${e.espectaculoId}`,
                {
                  method: "POST"
                }
              );

            }
          );

          alert("Pago completado");

          this.carritoService.limpiar();

          this.clientSecret = "";
          this.card = null;

          const form =
            document.getElementById("payment-form") as HTMLElement;

          if (form) {
            form.style.display = "none";
          }

        }

      })
      .catch((error: unknown) => {

        console.error("Error confirmando pago:", error);

        alert("No se ha podido confirmar el pago.");

      });

  }

  // ABRIR RECUPERAR CONTRASEÑA
  abrirRecuperarPassword() {

    this.mostrarCarrito = false;
    this.mostrarRegistro = false;

    this.mostrarRecuperarPassword = true;
    this.recuperarEmail = "";
    this.recuperarMensaje = "";
    this.recuperarError = "";

  }

  cerrarRecuperarPassword() {

    this.mostrarRecuperarPassword = false;
    this.recuperarEmail = "";
    this.recuperarMensaje = "";
    this.recuperarError = "";

  }

  solicitarRecuperacionPassword() {

    this.recuperarMensaje = "";
    this.recuperarError = "";

    const email = this.recuperarEmail.trim().toLowerCase();

    if (!email) {
      this.recuperarError = "Introduce tu correo electrónico.";
      return;
    }

    if (!this.esEmailGmailValido(email)) {
      this.recuperarError = "Introduce un correo válido de Gmail. Ejemplo: usuario@gmail.com";
      return;
    }

    fetch(
      "http://localhost:8081/users/recuperar-password",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email
        })
      }
    )
      .then(async res => {

        const texto = await res.text();

        if (!res.ok) {
          throw new Error(
            this.obtenerMensajeError(
              texto,
              "No se ha podido solicitar la recuperación."
            )
          );
        }

        return texto;
      })
      .then(data => {

        this.recuperarMensaje =
          data ||
          "Si el correo existe, se ha enviado un enlace de recuperación.";

        this.recuperarEmail = "";

      })
      .catch(error => {

        console.error("Error recuperación:", error);

        this.recuperarError =
          error.message ||
          "No se ha podido enviar el correo de recuperación.";

      });

  }

}