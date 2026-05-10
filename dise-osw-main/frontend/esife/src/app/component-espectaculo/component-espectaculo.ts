import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ServiceEspectaculo } from '../service-espectaculo';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-component-espectaculo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './component-espectaculo.html',
  styleUrl: './component-espectaculo.css',
})
export class ComponentEspectaculo {
  escenarios: any = [];
  espectaculosFiltrados: any[] = [];
  espectaculoSeleccionado: any = null;
  hayBusqueda: boolean = false;
  escenarioExpandidoId: number | null = null;

  // Normaliza fechas a YYYY-MM-DD para comparar
  private normalizeToISO(fecha: string): string | null {
    if (!fecha) return null;
    fecha = fecha.trim();
    // Si ya es ISO
    if (/^[0-9]{4}-[0-9]{2}-[0-9]{2}/.test(fecha)) {
      return fecha.slice(0, 10);
    }
    // dd/mm/yyyy o dd-mm-yyyy
    const slash = fecha.indexOf('/');
    const dash = fecha.indexOf('-');
    if (slash > 0) {
      const parts = fecha.split('/');
      if (parts.length >= 3) {
        const d = parts[0].padStart(2, '0');
        const m = parts[1].padStart(2, '0');
        const y = parts[2];
        return `${y}-${m}-${d}`;
      }
    }
    if (dash > 0) {
      const parts = fecha.split('-');
      if (parts.length >= 3) {
        // could be yyyy-mm-dd or dd-mm-yyyy
        if (parts[0].length === 4) {
          return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        } else {
          return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
    }
    // fallback: try Date parse
    const d = new Date(fecha);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
    return null;
  }


  constructor(
    private espectaculosService: ServiceEspectaculo,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  getEscenarios() {
    this.espectaculosService.getEscenarios().subscribe(
      (response) => {
        this.escenarios = response;
      },
      (error) => {
        console.log("Error al obtener", error);
      }
    );
  }

  getEspectaculos(escenarios: any) {
    if (this.escenarioExpandidoId === escenarios.id) {
      this.escenarioExpandidoId = null;
      return;
    }

    this.escenarioExpandidoId = escenarios.id;

    if (escenarios.espectaculos && escenarios.espectaculos.length) {
      return;
    }

    this.espectaculosService.getEspectaculos(escenarios).subscribe(
      (response: any) => {
        escenarios.espectaculos = response;
      },
      (error) => {
        console.log("Error al obtener", error);
      }
    );
  }


  /*Ejemplo de una peticion anindad (se envia cuando se recibe la respuesta de la primera peticion, en este caso, se envia el numero total de entradas para luego obtener las entradas libres)
  getNumeroDeEntradas(espectaculo: any) {
    this.espectaculosService.getNumeroDeEntradas(espectaculo).subscribe(
      (response: any) => {
        espectaculo.entradasTotales = response;
        this.getEntradasLibres(espectaculo);
      },
      (error) => {
        console.log("Error al obtener", error);
      }
    );
  }
  
  */



  getNumeroDeEntradas(espectaculo: any) {
    this.espectaculosService.getNumeroDeEntradasComoDto(espectaculo).subscribe(
      (response: any) => {
        espectaculo.entradas = response;
        this.espectaculoSeleccionado = espectaculo;
        this.getEntradasLibres(espectaculo);
      },
      (error) => {
        console.log("Error al obtener", error);
      }
    );
  }


  getEntradasLibres(espectaculo: any) {
    this.espectaculosService.getEntradasLibres(espectaculo).subscribe(
      (response: any) => {
        espectaculo.entradasLibres = response;
      },
      (error) => {
        console.log("Error al obtener", error);
      }
    );
  }

  irAComprarEntradas() {
    if (!this.espectaculoSeleccionado) {
      return;
    }

    const urlTree = this.router.createUrlTree(['/compra'], {
      queryParams: {
        espectaculoId: this.espectaculoSeleccionado.id,
        artista: this.espectaculoSeleccionado.artista,
        libres: this.espectaculoSeleccionado.entradasLibres ?? 0,
      },
    });

    const url = this.router.serializeUrl(urlTree);
    window.open(url, '_blank');
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {

      const artista = params['artista'];
      const fecha = params['fecha'];
      this.hayBusqueda = !!(artista || fecha);

      // Si hay artista (con o sin fecha) pedimos por artista y filtramos localmente por fecha
      if (artista) {
        this.espectaculosService.getEspectaculosPorArtista(artista).subscribe((res: any[]) => {
          if (fecha && fecha.trim() !== '') {
            const target = this.normalizeToISO(fecha);
            if (target) {
              this.espectaculosFiltrados = res.filter(e => {
                const iso = this.normalizeToISO(e.fecha);
                return iso === target;
              });
            } else {
              this.espectaculosFiltrados = [];
            }
          } else {
            this.espectaculosFiltrados = res;
          }
        });
      }

      // Solo fecha → pedimos al backend por fecha
      else if (fecha) {
        // si viene en formato YYYY-MM-DD, convertir al formato que espera el backend si es necesario
        this.espectaculosService.getEspectaculosPorFecha(fecha).subscribe(res => this.espectaculosFiltrados = res);
      }

      // Nada → mostrar todo
      else {
        this.getEscenarios();
      }

    });
  }
  verEntradas(e: any) {
    this.router.navigate(['/entradas'], {
      queryParams: {
        id: e.id,
        artista: e.artista,
        fecha: e.fecha,
        escenario: e.escenario
      }
    });
  }
}

