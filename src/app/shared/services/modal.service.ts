import { Injectable, Type } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

@Injectable({
  providedIn: 'root'
})
export class ModalService {

  constructor(private dialog: MatDialog) { }

  /**
   * Abre un componente como un modal de Angular Material
   * @param component El componente que se desea renderizar
   * @param data Datos que se pasan al componente (accesibles vía MAT_DIALOG_DATA)
   * @param width Ancho del modal
   */
  open(component: Type<any>, data: any = {}, width: string = '650px') {
    return this.dialog.open(component, {
      width,
      data,
      disableClose: true,
      autoFocus: 'first-tab',
      panelClass: 'custom-modal-panel'
    });
  }
}
