import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalEditarDistribuidorComponent } from './modal-editar-distribuidor.component';

describe('ModalEditarDistribuidorComponent', () => {
  let component: ModalEditarDistribuidorComponent;
  let fixture: ComponentFixture<ModalEditarDistribuidorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalEditarDistribuidorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModalEditarDistribuidorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
