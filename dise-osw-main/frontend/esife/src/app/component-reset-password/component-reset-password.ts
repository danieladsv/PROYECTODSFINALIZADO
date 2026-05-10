import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-component-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './component-reset-password.html',
  styleUrl: './component-reset-password.css'
})
export class ComponentResetPassword implements OnInit {

  token: string = "";

  nuevaPassword1: string = "";
  nuevaPassword2: string = "";

  mensajeOk: string = "";
  mensajeError: string = "";

  cargando: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || "";

      if (!this.token) {
        this.mensajeError = "El enlace de recuperación no es válido.";
      }
    });
  }

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

  cambiarPassword() {

    this.mensajeOk = "";
    this.mensajeError = "";

    if (!this.token) {
      this.mensajeError = "El enlace de recuperación no es válido.";
      return;
    }

    if (!this.nuevaPassword1 || !this.nuevaPassword2) {
      this.mensajeError = "Introduce la nueva contraseña dos veces.";
      return;
    }

    if (this.nuevaPassword1 !== this.nuevaPassword2) {
      this.mensajeError = "Las contraseñas no coinciden.";
      return;
    }

    /*
      No validamos aquí la seguridad de la contraseña.
      Dejamos que lo compruebe el backend para que, si el enlace ya fue usado
      o caducó, muestre el mensaje correcto:
      "Este enlace ya ha sido utilizado" o "El enlace ha caducado".
    */

    this.cargando = true;

    fetch(
      "http://localhost:8081/users/reset-password",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          token: this.token,
          nuevaPassword1: this.nuevaPassword1,
          nuevaPassword2: this.nuevaPassword2
        })
      }
    )
    .then(async res => {

      const texto = await res.text();

      if (!res.ok) {

        const mensaje = this.obtenerMensajeError(
          texto,
          "No se ha podido cambiar la contraseña."
        );

        throw new Error(mensaje);
      }

      return texto;
    })
    .then(data => {

      this.mensajeOk =
        data ||
        "Contraseña actualizada correctamente.";

      this.nuevaPassword1 = "";
      this.nuevaPassword2 = "";

      setTimeout(() => {
        this.router.navigate(['/']);
      }, 2500);

    })
    .catch((error: any) => {

      console.error("Error reset password:", error);

      this.mensajeError =
        error.message ||
        "No se ha podido cambiar la contraseña.";

    })
    .finally(() => {
      this.cargando = false;
    });
  }
}