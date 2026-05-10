import { Component, OnInit } from '@angular/core';
import { ServicePagos } from '../service-pagos';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

declare let Stripe: any;

@Component({
  selector: 'app-component-compra',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './component-compra.html',
  styleUrl: './component-compra.css'
})
export class ComponentCompra implements OnInit {
  artista = 'Espectaculo';
  libres = 0;
  espectaculoId: number | null = null;

  /*constructor(private route: ActivatedRoute) {
    this.route.queryParamMap.subscribe((params) => {
      this.artista = params.get('artista') ?? 'Espectaculo';
      this.libres = Number(params.get('libres') ?? 0);
    });*/


  importe: Number = 20.0;
  clientSecret?: string;
  stripe = Stripe('pk_test_51T4n7K205klxN2ZJ7oLZj2qyk0wN3xtpk05QhO1e0a4dXWCqAU4nvQ7fJ9YXVeKd31o29x9osIo4xZSk42zr8gn700X4HnCgiV');
  tokenUsuario = '';
  demoEntradas = 3;
  demoPersonas = 5;


  constructor(
    private service: ServicePagos,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.artista = params.get('artista') ?? 'Espectaculo';
      this.libres = Number(params.get('libres') ?? 0);
      this.espectaculoId = Number(params.get('espectaculoId') ?? 0) || null;

      this.tokenUsuario = sessionStorage.getItem('tokenUsuario') ?? '';
    });
  }


  irAlPago() {
    let info = {
      centimos: Math.floor(this.importe.valueOf() * 100),
    }

    this.service.prepararPago(info).subscribe(
      (response) => {
        this.clientSecret = response;
        this.showForm();
      },
      (error) => {
        console.error("Error al preparar el pago:", error);
        // Aquí puedes mostrar un mensaje de error al usuario
      }
    );
  }

  showForm() {
    let elements = this.stripe.elements()
    let style = {
      base: {
        color: "#32325d", fontFamily: 'Arial, sans-serif',
        fontSmoothing: "antialiased", fontSize: "16px",
        "::placeholder": {
          color: "#32325d"
        }
      },
      invalid: {
        fontFamily: 'Arial, sans-serif', color: "#fa755a",
        iconColor: "#fa755a"
      }
    }
    let card = elements.create("card", { style: style })
    card.mount("#card-element")
    card.on("change", function (event: any) {
      document.querySelector("button")!.disabled = event.empty;
      document.querySelector("#card-error")!.textContent =
        event.error ? event.error.message : "";
    });
    let self = this
    let form = document.getElementById("payment-form");
    form!.addEventListener("submit", function (event) {
      event.preventDefault();
      self.payWithCard(card);
    });
    form!.style.display = "block"
  }
  payWithCard(card: any) {
    let self = this
    this.stripe.confirmCardPayment(this.clientSecret, {
      payment_method: {
        card: card
      }
    }).then((response: any) => {
      if (response.error) {
        alert(response.error.message);
      } else {
        if (response.paymentIntent.status === 'succeeded') {
          alert("Pago exitoso");
          /*self.paymentsService.confirm().subscribe({
            next: (response: any) => {
              alert(response)
            },
            error: (response: any) => {
              alert(response)
            }
          })*/
        }
      }
    });
  }
}
