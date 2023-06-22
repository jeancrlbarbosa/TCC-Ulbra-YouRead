import { HomeServiceService } from './../../services/home-service.service';
import { Directive, Input } from '@angular/core';
import { AbstractControl, NG_VALIDATORS } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

@Directive({
  selector: '[valicadoCPFCNPJ]',
  providers: [{provide: NG_VALIDATORS, useExisting: validaCPFCNPJ, multi: true}]
})
export class validaCPFCNPJ {

  @Input('appValidateCpfCnpj')
  appValidateCpfCnpj;

  constructor(
    private homeservice: HomeServiceService
  ) { }

  public validate(control: AbstractControl): { [key: string]: any } {


    if (!control.value) {
      return { appValidateCpfCnpj: true };
    }

    const cpfCnpj = control.value.replace(/\D+/g, '');

    if (cpfCnpj === '') {
      return { appValidateCpfCnpj: true };
    } else {
      if (cpfCnpj.length === 14) {
        const cpf = cpfCnpj;
        if (cpf === '00000000000000' ||
          cpf === '11111111111111' ||
          cpf === '22222222222222' ||
          cpf === '33333333333333' ||
          cpf === '44444444444444' ||
          cpf === '55555555555555' ||
          cpf === '66666666666666' ||
          cpf === '77777777777777' ||
          cpf === '88888888888888' ||
          cpf === '99999999999999') {

          this.homeservice.notifica('error', 'CNPJ Inválido');
          return { appValidateCpfCnpj: true };
        } else {
          let soma, pos, numeros, digitos, resultado, tamanho;
          // Valida DVs
          tamanho = cpf.length - 2;
          numeros = cpf.substring(0, tamanho);
          digitos = cpf.substring(tamanho);
          soma = 0;
          pos = tamanho - 7;
          for (let i = tamanho; i >= 1; i--) {
            soma += numeros.charAt(tamanho - i) * pos--;
            if (pos < 2) { pos = 9; }
          }
          resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
          if (String(resultado) !== digitos.charAt(0)) {

            this.homeservice.notifica('error', 'CNPJ Inválido');
            return { appValidateCpfCnpj: true };
          } else {
            tamanho = tamanho + 1;
            numeros = cpf.substring(0, tamanho);
            soma = 0;
            pos = tamanho - 7;
            for (let i = tamanho; i >= 1; i--) {
              soma += numeros.charAt(tamanho - i) * pos--;
              if (pos < 2) { pos = 9; }
            }
            const resultado2 = soma % 11 < 2 ? 0 : 11 - soma % 11;
            if (String(resultado2) !== digitos.charAt(1)) {

              this.homeservice.notifica('error', 'CNPJ Inválido');
              return { appValidateCpfCnpj: true };
            } else {
              return null;
            }
          }
        }
      } else if (cpfCnpj.length === 11) {
        const cpf = cpfCnpj;
        let rev;
        let add;
        let i;
        if (cpf === '') { return { appCpfValidate: true }; }

        if (cpf.length !== 11 ||
          cpf === '00000000000' ||
          cpf === '11111111111' ||
          cpf === '22222222222' ||
          cpf === '33333333333' ||
          cpf === '44444444444' ||
          cpf === '55555555555' ||
          cpf === '66666666666' ||
          cpf === '77777777777' ||
          cpf === '88888888888' ||
          cpf === '99999999999') {

          this.homeservice.notifica('error', 'CPF Inválido');
          return { appCpfValidate: true };
        }

        add = 0;
        for (i = 0; i < 9; i++) {
          add += Math.floor(cpf.charAt(i)) * (10 - i);
        }
        rev = 11 - (add % 11);
        if (rev === 10 || rev === 11) {
          rev = 0;
        }
        if (rev !== Math.floor(cpf.charAt(9))) {

          this.homeservice.notifica('error', 'CPF Inválido');
          return { appCpfValidate: true };
        }

        add = 0;
        for (i = 0; i < 10; i++) {
          add += Math.floor(cpf.charAt(i)) * (11 - i);
        }
        rev = 11 - (add % 11);
        if (rev === 10 || rev === 11) {
          rev = 0;
        }
        if (rev !== Math.floor(cpf.charAt(10))) {

          this.homeservice.notifica('error', 'CPF Inválido');
          return { appCpfValidate: true };
        }
        return null;
      } else if (cpfCnpj.length < 11 || (cpfCnpj.length > 11 && cpfCnpj.length > 14)) {
        return { appCnpjValidate: true };
      } else {
        return { appCnpjValidate: true };
      }
    }

  }

}
