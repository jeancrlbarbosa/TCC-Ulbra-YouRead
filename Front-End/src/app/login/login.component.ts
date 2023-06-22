import { HomeServiceService } from './../services/home-service.service';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  constructor(

    private router: Router,
    private homeservice: HomeServiceService
  ) {}

  public type = 'login';
  ngOnInit() {

    this.formCad();
    this.iniciaConfiguracoes();
  }


  public cad: FormGroup;;
  public cadInit = {
    logusu: null, pashas: null, emausu: null,
    pasha2: null, nomusu: null, tipusu: null,
    nomaut: null, apanom: null, codrec: null,
    cnpjpf: null};
  public showPass = false;
  public showPassRep = false;
  public emailValido = false;
  public simnaoList = [
    {codigo: 'S', descri: 'Sim'},
    {codigo: 'N', descri: 'Não'}
  ]

  public tipoUsuarioList = [
    {codigo: 'U', descri: 'Usuário'},
    {codigo: 'A', descri: 'Autor'},
    {codigo: 'S', descri: 'Anunciante'}
  ];
  public cpf = [/\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/];
  public cnpj = [/\d/, /\d/, '.', /\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '/', /\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/];



  recuperar () {

    this.router.navigate(['/recuperar-senha']);
  }

  senha(varivel, aparece) {

    this[varivel] = aparece;
  }

  rotas(url) {

    if (url === 'login') {

      this.formCad();
    } else if (url === 'sign') {

      this.formCad();
    } else if (url === 'recuperar-senha') {

      this.formCad();
    } else if (url === 'valida-codigo') {

      this.formCad();
    }
    this.router.navigate([`/${url}`]);
  }

  iniciaConfiguracoes() {

    if (this.homeservice.getID('YR_TOKEN')) {

      this.rotas('home');
    }
    if (this.router.url.includes('login')) {

      this.type = 'login';
      this.homeservice.configuraStorage();
    } else if (this.router.url.includes('recuperar-senha')) {

      this.type = 'recuperar-senha';
    } 
    else if (this.router.url.includes('valida-codigo')) {

      this.type = 'valida-codigo';
    } else if (this.router.url.includes('nova-senha')) {

      this.type = 'nova-senha';
      this.cad.patchValue({codrec: this.homeservice.getID('YR_REC')});
      this.homeservice.renoveStorage('YR_REC')
    } else if (this.router.url.includes('sign')) {

      this.type = 'sign';
    }
  }

  verificaSessao() {

    if (!this.homeservice.getID()) {

      this.homeservice.notifica('error', 'Sessão inexistente você será redirecionado para a tela inicial!');
      this.homeservice.renoveStorage('YR_TOKEN');
      this.rotas('login');
    }
  }
  
  async criarUsuario() {

    this.verificaSessao();
    let item = Object.assign({}, this.cad.value);
    if (item.cnpjpf) { item.cnpjpf = this.removeCaracteresEspeciais(item.cnpjpf); }
    const retorno = await this.homeservice.postputhttp('post', 'criar-usuario', item);

    if (retorno && retorno['codigo'] === 200) {

      this.homeservice.notifica('success', retorno['mensagem']);
      this.rotas('login');
    } else if (retorno && retorno['codigo'] === 201) {

      this.homeservice.notifica('warning', retorno['mensagem']);
    }
  }


  async login() {

    this.verificaSessao();
    let item = Object.assign({}, this.cad.value);
    item.pasha2 = item.pashas;
    item.pashas = this.homeservice.geraHash(item.pashas + this.homeservice.getID() + this.homeservice.geraHash());
    const retorno = await this.homeservice.postputhttp('post', 'login', item);

    if (retorno && retorno['codigo'] === 200) {

      if (this.homeservice.validaLoginSenha(retorno)) {

        this.homeservice.setStorage('YR_COD', retorno['codusu']);
        this.homeservice.notifica('success', 'Login feito com sucesso! Seja bem vindo ao Youread.');
        this.rotas('home');
      } else {

        this.homeservice.notifica('error', 'Autenticação de usuário inválida, tente mais tarde!');
      }
    } else if (retorno && retorno['codigo'] === 201) {

      this.homeservice.notifica('warning', retorno['mensagem']);
    }
  }

  async gerarCodigo () {

    this.verificaSessao();
    let item = Object.assign({}, this.cad.value);
    const retorno = await this.homeservice.postputhttp('post', 'recuperar-senha', {emausu: item.emausu});

    if (retorno && retorno['codigo'] === 200) {


      this.homeservice.notifica('success', retorno['mensagem']);
      this.rotas('valida-codigo')
    } else if (retorno && retorno['codigo'] === 201) {

      this.homeservice.notifica('warning', retorno['mensagem']);
    }
  }

  async salvarSenha() {

    this.verificaSessao();
    let item = Object.assign({}, this.cad.value);
    item.pasha3 = this.homeservice.geraHash(item.pashas + item.pasha2 + this.homeservice.getID() + this.homeservice.geraHash());
    const retorno = await this.homeservice.postputhttp('post', 'salvar-senha', item);

    if (retorno && retorno['codigo'] === 200) {


      this.homeservice.notifica('success', retorno['mensagem']);
      this.rotas('login')
    } else if (retorno && retorno['codigo'] === 201) {

      this.homeservice.notifica('warning', retorno['mensagem']);
    }
  }


  async verificaCodigo () {

    this.verificaSessao();
    let item = Object.assign({}, this.cad.value);
    const retorno = await this.homeservice.postputhttp('post', 'verifica-codigo', {codrec: item.codrec});

    if (retorno && retorno['codigo'] === 200) {


      this.homeservice.notifica('success', retorno['mensagem']);
      this.homeservice.setStorage('YR_REC', item.codrec);
      this.rotas('nova-senha');
    } else if (retorno && retorno['codigo'] === 201) {

      this.homeservice.notifica('warning', retorno['mensagem']);
    }
  }

  trocaTipoUsuario() {

    if ((this.cad.controls.tipusu.value || 'U') === 'U') {

      this.cad.patchValue({nomaut: null, apanom: null, cnpjpf: null});
    } else if ((this.cad.controls.tipusu.value || 'A') === 'A') {

      this.cad.patchValue({cnpjpf: null});
    }
  }

  validaCampos(tipo) {

    if (tipo === 1) {

      return this.cad.valid ? true : false;
    }
  }

  formCad() {
    this.cad = new FormGroup({
      logusu: new FormControl({value: this.cadInit.logusu, disabled: false}),
      pashas: new FormControl({value: this.cadInit.pashas, disabled: false}),
      emausu: new FormControl({value: this.cadInit.emausu, disabled: false}),
      pasha2: new FormControl({value: this.cadInit.pasha2, disabled: false}),
      nomusu: new FormControl({value: this.cadInit.nomusu, disabled: false}),
      tipusu: new FormControl({value: this.cadInit.tipusu, disabled: false}),
      nomaut: new FormControl({value: this.cadInit.nomaut, disabled: false}),
      apanom: new FormControl({value: this.cadInit.apanom, disabled: false}),
      codrec: new FormControl({value: this.cadInit.codrec, disabled: false}),
      cnpjpf: new FormControl({value: this.cadInit.cnpjpf, disabled: false})
    })
  }


  ValidateEmail() {

    var validRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  
    if ((!this.cad.controls.emausu.value.match(validRegex)) && (this.cad.controls.emausu.value)) {
  
      this.homeservice.notifica('error', 'E-mail Inválido');
      this.cad.controls.emausu.setErrors({'incorrect': true});
      return;
    }
    this.cad.controls.emausu.setErrors(null);
  }

  validatePassword(campo) {
    let newPassword = this.cad.controls[campo].value;
    let minNumberofChars = 8;
    let maxNumberofChars = 16;
    let regularExpression = /^[a-zA-Z0-9!@#$%^&*]{6,16}$/;
    if(newPassword) {

      if (newPassword.length < minNumberofChars || newPassword.length > maxNumberofChars) {

        this.homeservice.notifica('info', 'A senha deve conter entre 8 e 16 caracteres!');
        this.cad.controls[campo].setErrors({ 'incorrect': true });
        return;
      }
      if (!regularExpression.test(newPassword)) {
  
        this.homeservice.notifica('info', 'A senha deve conter caracteres especiais, números e letras maíusculas e minusculas!');
        this.cad.controls[campo].setErrors({ 'incorrect': true });
        return;
      }

      if ((this.cad.controls[campo === 'pashas' ? 'pasha2' : 'pashas'].value) && (newPassword !== this.cad.controls[campo === 'pashas' ? 'pasha2' : 'pashas'].value)) {

        this.homeservice.notifica('info', 'As senhas não são iguais!');
        this.cad.controls[campo].setErrors({ 'incorrect': true });
        return;
      }
    }

    this.cad.controls[campo].setErrors(null);
    this.cad.updateValueAndValidity();
  }

  removeCaracteresEspeciais(string) {
    return string.replace(/[^a-zA-Z0-9]/g, "");
  }

}
