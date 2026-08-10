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
   * @param maxWidth Ancho máximo del modal (Material lo limita a 80vw por default si no se especifica)
   * @param panelClass Clase(s) CSS del panel del modal (por default la que usan el resto de los módulos)
   */
  open(component: Type<any>, data: any = {}, width: string = '650px', maxWidth: string = '80vw', panelClass: string | string[] = 'custom-modal-panel') {
    return this.dialog.open(component, {
      width,
      maxWidth,
      data,
      disableClose: true,
      autoFocus: 'first-tab',
      panelClass
    });
  }
}
