import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HomeServiceService } from '../services/home-service.service';
import * as moment from 'moment';
import * as _ from 'lodash';
import * as d3 from 'd3-scale';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {

  constructor(

    private router: Router,
    private activerouter: ActivatedRoute,
    private homeservice: HomeServiceService,
    private domSanitizer: DomSanitizer
  ) {
    this.getScreenSize();
  }

  ngOnInit() {

    this.iniciaComponente();
  }

  ngOnDestroy(): void { 
  }
//
  public type = 'login';
  public subType = ''
  public cad: FormGroup;;
  public cadInit = {
    codusu: null, logusu: null, nomusu: null, 
    emausu: null, tipusu: 'U', nomaut: null, 
    apanom: null, cnpjpf: null, monace: 'N',
    permon: 'N', reqace: 'N', pashas: null, 
    pasha2: null, pasha3: null, motmon: null,
    codgen: null, tagger: null, pubger: null,
    codanu: null, desanu: null, prianu: null, 
    status: null, files_: null};
  public showPass = false;
  public showPassRep = false;
  public showPassRep2 = false;
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
  public tipoUsuarioListABase = [
    {codigo: 'U', descri: 'Usuário'},
    {codigo: 'A', descri: 'Autor'},
    {codigo: 'S', descri: 'Anunciante'}
  ];
  public prioridadeAnuncioList = [
    {codigo: 'B', descri: 'Baixo'},
    {codigo: 'M', descri: 'Médio'},
    {codigo: 'A', descri: 'Alto'}
  ]
  public pages = [
    {codpai: '', nomcam: '1_', descam: 'Home', fun: this.home},
    {codpai: '', nomcam: '2_', descam: 'Minhas Obras', fun: this.minhasObras},
    {codpai: '', nomcam: '3_', descam: 'Favoritos', fun: this.favoritos},
    {codpai: '', nomcam: '4_', descam: 'Configurações', fun: this.configuracoes},
    {codpai: '', nomcam: '5_', descam: 'Sair', fun: this.sair}
  ];
  public pagesBase = [
    {codpai: '', nomcam: '1_', descam: 'Home', fun: this.home},
    {codpai: '', nomcam: '2_', descam: 'Minhas Obras', fun: this.minhasObras},
    {codpai: '', nomcam: '3_', descam: 'Favoritos', fun: this.favoritos},
    {codpai: '', nomcam: '4_', descam: 'Configurações', fun: this.configuracoes},
    {codpai: '', nomcam: '5_', descam: 'Sair', fun: this.sair}
  ];
  public ativoList = [
    {codigo: 'A', descri: 'Ativo'},
    {codigo: 'D', descri: 'Desativado'}
  ]
  public ladoList = [
    {codigo: 'D', descri: 'Direito'},
    {codigo: 'E', descri: 'Esquerdo'}
  ]
  public livrosList = [];
  public tiposArquivos = ['jpeg', 'JPG', 'jpg', 'PNG', 'png'];
  public paginasList = [];
  public requisitaMonetizacaoList = [];
  public generosList = [];
  public anunciosList = [];
  public arquivosSelecionadosList = []
  public generosLivrosList = [];
  public capitulo = {arquivosList: []};
  public isCollapsed = false;
  public pesquisa = null;
  public cpf = [/\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/];
  public cnpj = [/\d/, /\d/, '.', /\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '/', /\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/];
  public screenHeight: number;
  public screenWidth: number;

  @HostListener('window:resize', ['$event'])
  getScreenSize(event?) {
    this.screenHeight = window.innerHeight;
    this.screenWidth = window.innerWidth;
    console.log(this.screenHeight, this.screenWidth);
  }

  iniciaComponente() {

    this.formCad();
    this.criaMenuPaginas();
    setTimeout(() => {

      this.iniciaConfiguracoes();
    }, 50);
  }

  sair() {

    this.rotas('login');
  }

  configuracoes() {

    this.rotas('home-configuracoes');
  }

  minhasObras() {

    this.rotas('home-livro', { queryParams: {subType: 'minhas-obras'} });
  }

  adicionarLivro() {

    this.rotas('home-livro', { queryParams: {subType: 'adicionar'} });
  }
  
  editarLivro(codliv) {

    this.rotas('home-livro', { queryParams: {subType: 'adicionar', codliv: codliv}, });
  }

  favoritos() {

    this.rotas('home-livro', { queryParams: {subType: 'favoritos'} });
  }

  pesquisar() {

    this.rotas('home-livro', { queryParams: {subType: 'pesquisar', pesquisa: this.pesquisa} })
  }

  home() {

    this.rotas('home')
  }

  lerLivro(capitulo) {

    this.rotas('home-leitor', { queryParams: {codliv: capitulo.codliv, codcap: capitulo.codcap}, });
  }

  senha(varivel, aparece) {

    this[varivel] = aparece;
  }

  rotas(url, queryParams?) {

    if (url === 'login') {

      this.homeservice.renoveStorage('YR_COD');
      this.homeservice.renoveStorage('YR_TOKEN');
      this.formCad();
    } else if (url === 'home-leitor') {

      this.formCad();
      this.livrosList = [];
      this.capitulo = {arquivosList: []};
    } else if (url === 'home-livro') {

      this.formCad();
      this.livrosList = [];
      this.generosLivrosList = [];
      this.getConfiguracoes(1);
    } else if (url === 'home-configuracoes') {

      this.formCad();
      this.requisitaMonetizacaoList = [];
      this.generosList = [];
      this.anunciosList = [];
      this.tipoUsuarioList = this.tipoUsuarioListABase;
    }
    this.router.navigate([`/${url}`], queryParams);
    if (this.router.url.includes(url)) {

      this.iniciaComponente();
    }
  }

  iniciaConfiguracoes(part?) {

    this.verificaSessao();
    if (this.router.url.includes('home-leitor')) {

      this.type = 'leitor';
      if (!part) {

        this.getConfiguracoes(1);
      }
      if (part === 1) {

        if (this.activerouter.snapshot.queryParams && 
            this.activerouter.snapshot.queryParams.codliv && 
            this.activerouter.snapshot.queryParams.codcap) {

          this.getLivros({tippes: 5, 
                          codliv: this.activerouter.snapshot.queryParams.codliv, 
                          codcap: this.activerouter.snapshot.queryParams.codcap});
        }
      }
    } else if (this.router.url.includes('home-livro')) {

      this.type = 'livro';
      this.livrosList = [];
      this.generosLivrosList = [];
      if (!part) {

        this.getConfiguracoes(1);
      }
      if (part === 1) {

        if (this.activerouter.snapshot.queryParams && this.activerouter.snapshot.queryParams.subType === 'minhas-obras') {

          this.subType = 'minhas-obras';
          this.pesquisa = null;
          this.getLivros({tippes: 1});
        }
        if (this.activerouter.snapshot.queryParams && this.activerouter.snapshot.queryParams.subType === 'adicionar') {
  
          this.subType = 'adicionar';
          this.pesquisa = null;

          if (this.activerouter.snapshot.queryParams && this.activerouter.snapshot.queryParams.codliv) {

            this.getLivros({tippes: 2, codliv: this.activerouter.snapshot.queryParams.codliv});
          } else {

            this.livrosList.push({visualizar: false, codliv: null, codusu: this.cad.controls.codusu.value, habmon: this.cad.controls.monace.value,
              titulo: null, datcri: null, desliv: null, visliv: 'S', bas64s: null, tiparq: null, valace: 0, vingen: null, style: '',
              isColapse: true,
              nomaut: (this.cad.controls.apanom.value === 'S') && this.cad.controls.nomaut.value ? this.cad.controls.nomaut.value : this.cad.controls.nomusu.value,
              generosList: [],
              capitulosList: []
            });
          }
          this.getGeneros();
        }
        if (this.activerouter.snapshot.queryParams && this.activerouter.snapshot.queryParams.subType === 'favoritos') {

          this.subType = 'favoritos';
          this.pesquisa = null;
          this.getLivros({tippes: 3});
        }
        if (this.activerouter.snapshot.queryParams && this.activerouter.snapshot.queryParams.subType === 'pesquisar') {

          this.subType = 'pesquisar';
          this.pesquisa = this.activerouter.snapshot.queryParams.pesquisa;
          this.getLivros({tippes: 4, pesquisa: this.activerouter.snapshot.queryParams.pesquisa});
        }
        this.criaMenuPaginas();
      }
    } else if (this.router.url.includes('home-configuracoes')) {

      this.type = 'configuracoes';
      this.requisitaMonetizacaoList = [];
      this.generosList = [];
      this.anunciosList = [];
      this.pesquisa = null;
      this.tipoUsuarioList = this.tipoUsuarioListABase;
      this.getConfiguracoes();
    } else {

      this.getConfiguracoes();
    }
  }

  verificaSessao() {

    if ((!this.homeservice.getID()) || (!this.homeservice.getID('YR_TOKEN')) || (!this.homeservice.getID('YR_COD'))) {

      this.homeservice.notifica('error', 'Sessão inexistente você será redirecionado para a tela inicial!');
      this.homeservice.renoveStorage('YR_COD');
      this.homeservice.renoveStorage('YR_TOKEN');
      this.rotas('login');
    }
  }

  trocaTipoUsuario() {

    if ((this.cad.controls.tipusu.value || 'U') === 'U') {

      this.cad.patchValue({nomaut: null, apanom: null, monace: 'N'});
    } else if ((this.cad.controls.tipusu.value || 'A') === 'A') {

      this.cad.patchValue({cnpjpf: null});
    }
  }

  validaCampos(tipo) {

    if (tipo === 1) {

      if (this.cad.controls.logusu.valid && this.cad.controls.nomusu.valid && this.cad.controls.emausu.valid && this.cad.controls.tipusu.valid && 
        ((this.cad.controls.tipusu.value === 'A') && (this.cad.controls.apanom.value === 'S') ? ((this.cad.controls.nomaut.value || '').length > 0) : true) && 
        ((this.cad.controls.tipusu.value === 'A') && (this.cad.controls.monace.value === 'S') ? this.cad.controls.cnpjpf.valid : true)) {

        return true;
      } else {

        return false;
      }
    } else if (tipo === 2) {

      if (this.cad.controls.monace.valid) {

        return true;
      } else {

        return false;
      }
    } else if (tipo === 3) {

      if (this.cad.controls.tagger.value.includes(' ')) {

        return true;
      } else {

        return false;
      }
    } else if (tipo === 4) {

      if (this.cad.controls.tagger.valid && this.cad.controls.pubger.valid) {

        return true;
      } else {

        return false;
      }
    } else if (tipo === 5) {

      if ((!this.cad.controls.codanu.value ? true : false)) {

        return true;
      } else {

        return false;
      }
    } else if (tipo === 6) {

      if (this.cad.controls.desanu.valid && this.cad.controls.prianu.valid &&
          this.cad.controls.status.valid && (this.cad.controls.codanu.value ? true : (this.arquivosSelecionadosList.length > 0))) {

        return true;
      } else {

        return false;
      }
    } else if (tipo === 7) {

      let livrosSemGenero = this.livrosList.find(f => f.generosList.length === 0);
      let livrosSemcapitulo = this.livrosList.find(f => f.capitulosList.length === 0);
      let livrosSemArquivo = this.livrosList.find(f => f.capitulosList.find(c => c.arquivosList.length === 0));
      let capituloSemOrdem = this.livrosList.find(f => f.capitulosList.find(c => (!c.ordcap) || (c.ordcap && (c.ordcap < 0))));
      let capituloSemNome = this.livrosList.find(f => f.capitulosList.find(c => (!c.numcap) || (c.numcap && (c.numcap.length === 0))));
      if ((this.livrosList[0].titulo && (this.livrosList[0].titulo.length > 0)) && 
          (!livrosSemcapitulo) &&
          (!livrosSemGenero) && 
          (!livrosSemArquivo) && 
          (!capituloSemOrdem) && 
          (!capituloSemNome)) {

        return true;
      } else {

        return false;
      }
    }
  }

  formCad() {
    this.cad = new FormGroup({
      codusu: new FormControl({value: this.cadInit.codusu, disabled: false}),
      logusu: new FormControl({value: this.cadInit.logusu, disabled: false}),
      nomusu: new FormControl({value: this.cadInit.nomusu, disabled: false}),
      emausu: new FormControl({value: this.cadInit.emausu, disabled: false}),
      tipusu: new FormControl({value: this.cadInit.tipusu, disabled: false}),
      nomaut: new FormControl({value: this.cadInit.nomaut, disabled: false}),
      apanom: new FormControl({value: this.cadInit.apanom, disabled: false}),
      cnpjpf: new FormControl({value: this.cadInit.cnpjpf, disabled: false}),
      monace: new FormControl({value: this.cadInit.monace, disabled: false}),
      permon: new FormControl({value: this.cadInit.permon, disabled: false}),
      reqace: new FormControl({value: this.cadInit.reqace, disabled: false}),
      pashas: new FormControl({value: this.cadInit.pashas, disabled: false}),
      pasha2: new FormControl({value: this.cadInit.pasha2, disabled: false}),
      pasha3: new FormControl({value: this.cadInit.pasha3, disabled: false}),
      motmon: new FormControl({value: this.cadInit.motmon, disabled: false}),
      codgen: new FormControl({value: this.cadInit.codgen, disabled: false}),
      tagger: new FormControl({value: this.cadInit.tagger, disabled: false}),
      pubger: new FormControl({value: this.cadInit.pubger, disabled: false}),
      codanu: new FormControl({value: this.cadInit.codanu, disabled: false}),
      desanu: new FormControl({value: this.cadInit.desanu, disabled: false}),
      prianu: new FormControl({value: this.cadInit.prianu, disabled: false}),
      status: new FormControl({value: this.cadInit.status, disabled: false}),
      files_: new FormControl({value: this.cadInit.files_, disabled: false})
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

      if ((this.cad.controls[campo === 'pasha2' ? 'pasha3' : 'pasha2'].value) && (newPassword !== this.cad.controls[campo === 'pasha2' ? 'pasha3' : 'pasha2'].value)) {

        this.homeservice.notifica('info', 'As senhas não são iguais!');
        this.cad.controls[campo].setErrors({ 'incorrect': true });
        return;
      }
    }

    this.cad.controls[campo].setErrors(null);
    this.cad.updateValueAndValidity();
  }

  async criaMenuPaginas() {
   
    if (this.cad && (this.cad.controls.tipusu.value !== 'A')) {

      this.pages = this.pages.filter(f => f.nomcam !== '2_');
    } else {

      if (!this.pages.find(f => f.nomcam === '2_')) {

        this.pages.push(this.pagesBase[1]);
        this.pages = _.orderBy(this.pages, 'nomcam', 'asc');
      }
    }
    this.paginasList = this.montaPaginas(this.pages, 1);
  }

  montaPaginas(lista, inicio?) {
    let retorno = [];
    lista.forEach(element => {
      if ((inicio && inicio === 1 ? (element.codpai.length === 0) : (true))) {
        let filhos = this.pages.filter(filtro => filtro.codpai === element.nomcam);
        retorno.push({
          nomcam: element.nomcam,
          descam: element.descam,
          click: false,
          fun: element.fun || null,
          lognom: `list-icon ${element.nomlog ? element.nomlog : 'fab fa-adn'} fa-lg`,
          pagfil: filhos.length > 0 ? this.montaPaginas(filhos) : []
        })
      }
    });
    return retorno;
  }


  selectNavbar() {
    this.isCollapsed = !this.isCollapsed;
    this.isCollapsed ? document.getElementById('menu').setAttribute('class', 'menu-show') : document.getElementById('menu').setAttribute('class', 'menu-hide');
  }

  executaFuncao(lista) {
    
    if (lista && lista.fun) {

      lista.fun = lista.fun.bind(this);
      lista.fun();
    }
  }

  async getConfiguracoes(part?) {

    this.verificaSessao();
    const retorno = await this.homeservice.getdeletehttp('get', 'configuracoes-usuario', this.homeservice.getHeaders());

    if (retorno && retorno['codigo'] === 200) {


      let form = retorno['mensagem'];
      if (form.requisitaMonetizacaoList) {

        this.requisitaMonetizacaoList = form.requisitaMonetizacaoList;
      }
      if (form.generosList) {

        this.generosList = form.generosList;
      }
      if (form.anunciosList) {

        this.anunciosList = form.anunciosList;
      }
      if (form.tipusu ===  'S') {

        this.tipoUsuarioList = this.tipoUsuarioList.filter(f => f.codigo === 'S');
      }
      this.cad.patchValue(retorno['mensagem']);
      if (part) { this.iniciaConfiguracoes(part); }
      this.criaMenuPaginas();
    } else if (retorno && retorno['codigo'] === 201) {

      this.homeservice.notifica('warning', retorno['mensagem']);
    } else if (retorno && retorno['codigo'] === 401) {

      this.homeservice.renoveStorage('YR_TOKEN');
      this.verificaSessao();
    }
  }

  async salvarInformacoesPerfil() {

    this.verificaSessao();
    let item = Object.assign({}, this.cad.value);
    if (item.cnpjpf) { item.cnpjpf = this.removeCaracteresEspeciais(item.cnpjpf); }
    const retorno = await this.homeservice.postputhttp('post', 'salvar-perfil', item, this.homeservice.getHeaders());

    if (retorno && retorno['codigo'] === 200) {


      this.homeservice.notifica('success', retorno['mensagem']);
      this.iniciaConfiguracoes();
    } else if (retorno && retorno['codigo'] === 201) {

      this.homeservice.notifica('warning', retorno['mensagem']);
    } else if (retorno && retorno['codigo'] === 401) {

      this.homeservice.renoveStorage('YR_TOKEN');
      this.verificaSessao();
    }
  }

  async alterarSenha() {

    this.verificaSessao();
    let item = Object.assign({}, this.cad.value);
    item.pashas = item.pasha2;
    const retorno = await this.homeservice.postputhttp('post', 'salvar-senha-configuracoes', item, this.homeservice.getHeaders());

    if (retorno && retorno['codigo'] === 200) {

      this.homeservice.notifica('success', retorno['mensagem']);
      this.iniciaConfiguracoes();
    } else if (retorno && retorno['codigo'] === 201) {

      this.homeservice.notifica('warning', retorno['mensagem']);
    } else if (retorno && retorno['codigo'] === 401) {

      this.homeservice.renoveStorage('YR_TOKEN');
      this.verificaSessao();
    }
  }

  async requisitarMonetizacao() {

    this.verificaSessao();
    let item = Object.assign({}, this.cad.value);
    this.cad.patchValue({motmon: null});
    const retorno = await this.homeservice.postputhttp('post', 'salvar-requisicao-moentizacao', item, this.homeservice.getHeaders());

    if (retorno && retorno['codigo'] === 200) {

      this.cad.patchValue({motmon: null});
      this.homeservice.notifica('success', retorno['mensagem']);
      this.iniciaConfiguracoes();
    } else if (retorno && retorno['codigo'] === 201) {

      this.homeservice.notifica('warning', retorno['mensagem']);
    } else if (retorno && retorno['codigo'] === 401) {

      this.homeservice.renoveStorage('YR_TOKEN');
      this.verificaSessao();
    }
  }

  async salvarGenero() {

    this.verificaSessao();
    let item = Object.assign({}, this.cad.value);
    const retorno = await this.homeservice.postputhttp('post', 'salvar-genero', item, this.homeservice.getHeaders());

    if (retorno && retorno['codigo'] === 200) {

      this.limparGenero();
      this.homeservice.notifica('success', retorno['mensagem']);
      this.iniciaConfiguracoes();
    } else if (retorno && retorno['codigo'] === 201) {

      this.homeservice.notifica('warning', retorno['mensagem']);
    } else if (retorno && retorno['codigo'] === 401) {

      this.homeservice.renoveStorage('YR_TOKEN');
      this.verificaSessao();
    }
  }

  async excluirGenero(i) {

    this.verificaSessao();
    let item = Object.assign({}, this.cad.value);
    const retorno = await this.homeservice.getdeletehttp('delete', `delete-genero/${item.codusu}/${this.generosList[i].codgen}`, this.homeservice.getHeaders());

    if (retorno && retorno['codigo'] === 200) {

      this.homeservice.notifica('success', retorno['mensagem']);
      this.iniciaConfiguracoes();
    } else if (retorno && retorno['codigo'] === 201) {

      this.homeservice.notifica('warning', retorno['mensagem']);
    } else if (retorno && retorno['codigo'] === 401) {

      this.homeservice.renoveStorage('YR_TOKEN');
      this.verificaSessao();
    }
  }

  removeCaracteresEspeciais(string) {
    return string.replace(/[^a-zA-Z0-9]/g, "");
  }

  retornaDataFormatada(data) {
    return moment(data).format('DD/MM/YYYY');
  }

  verificaEspacamento() {

    if (this.validaCampos(3)) {

      this.homeservice.notifica('info', 'Gênero não deve conter espaços!');
      this.cad.controls.tagger.setErrors({ 'incorrect': true });
      return;
    }
    this.cad.controls.tagger.setErrors(null);
    this.cad.updateValueAndValidity();
  }

  selecionaEditarGenero(i) {

    this.cad.patchValue({codgen: this.generosList[i].codgen,
                         tagger: this.generosList[i].tagger,
                         pubger: this.generosList[i].pubger})
  }

  upload(event, i?, tipo?, x?) {

		let file;
		let nameanx = event.target.files[0].name.split(/\./);


		if (event.target.files.length === 1) {
			if (event.target.files[0]) {
				if (this.tiposArquivos.find( f => nameanx[nameanx.length - 1] === f)) {
					file = event.target.files[0];
					this.getBase64(file).then(
						data => {


							if (this.type === 'configuracoes') {

                if (this.arquivosSelecionadosList.find(f => f.desarq === nameanx[0])) {

                  this.homeservice.notifica('warning', 'Arquivo Já Vinculado!');
                  this.cad.controls.files_.patchValue(null);
                  return;
                }
                let lado = this.arquivosSelecionadosList.find(f => f.ladanu === 'D') ? 'E' : 'D';
                this.arquivosSelecionadosList.push({desarq: nameanx[0], tiparq: nameanx[nameanx.length - 1], ladanu: lado, bas64s: data});
              }
              if ((this.type === 'livro') && (this.subType === 'adicionar')) {

                if (tipo === 1) {

                  this.livrosList[i].tiparq = nameanx[nameanx.length - 1];
                  this.livrosList[i].bas64s = data;
                } else if (tipo === 2) {

                  this.livrosList[i].capitulosList[x].arquivosList.push({codcap: this.livrosList[i].capitulosList[x].codcap,
                  bas64s: data, tiparq: nameanx[nameanx.length - 1], nomarq: nameanx[0],
                  ordarq: this.livrosList[i].capitulosList[x].arquivosList.length > 0 ? (this.livrosList[i].capitulosList[x].arquivosList[this.livrosList[i].capitulosList[x].arquivosList.length - 1].ordarq + 1) : 1
                  });
                }
              }
							this.homeservice.notifica('success', 'O arquivo Vinculado com Sucesso');
              this.cad.controls.files_.patchValue(null);
						}
					);
				} else {

					this.homeservice.notifica('warning', 'O arquivo não é do Formato Aceito! Somente Aceito os Tipo de Arquivos jpeg, JPG, jpg, PNG, png');
          this.cad.controls.files_.patchValue(null);
					return;
				}
			}
		} else {

			event.target.files.length > 2 ? this.homeservice.notifica('warning', 'Não é Possível Selecionar mais de 1 Arquivo!') : '';
      this.cad.controls.files_.patchValue(null);
      return;
		}
	}


	getBase64(file) {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = () => {
				let encoded = reader.result.toString().replace(/^.*,/, '');
				resolve(encoded);
			};
			reader.onerror = error => reject(error);
		});

	}

  excluirArquivoAnuncio(i) {

    this.arquivosSelecionadosList.splice(i, 1);
  }

  selecionarAnuncio(i) {

    this.cad.patchValue({codanu: this.anunciosList[i].codanu,
                         desanu: this.anunciosList[i].desanu,
                         prianu: this.anunciosList[i].prianu,
                         status: this.anunciosList[i].status});
    this.arquivosSelecionadosList = [];            

  }
  

  async salvarAnuncio() {

    this.verificaSessao();
    let item = Object.assign({}, this.cad.value);
    if (!item.codanu) {


      let agrupado = _.groupBy(this.arquivosSelecionadosList, 'ladanu');
      let duplicado = false;
      _.forOwn(agrupado, (value, key) => {

        if (value.length > 1) {

          duplicado = true;
        }
      });
      if (duplicado) {

        this.homeservice.notifica('warning', 'Aquivos com lados iguais!');
        return;
      }
      item.arquivosList = this.arquivosSelecionadosList;
    }
    const retorno = await this.homeservice.postputhttp('post', 'salvar-anuncio', item, this.homeservice.getHeaders());

    if (retorno && retorno['codigo'] === 200) {

      this.limparAnuncio();
      this.homeservice.notifica('success', retorno['mensagem']);
      this.iniciaConfiguracoes();
    } else if (retorno && retorno['codigo'] === 201) {

      this.homeservice.notifica('warning', retorno['mensagem']);
    } else if (retorno && retorno['codigo'] === 401) {

      this.homeservice.renoveStorage('YR_TOKEN');
      this.verificaSessao();
    }
  }

  async excluirAnuncio(i) {

    this.verificaSessao();
    let item = Object.assign({}, this.cad.value);
    const retorno = await this.homeservice.getdeletehttp('delete', `delete-anuncio/${item.codusu}/${this.anunciosList[i].codanu}`, this.homeservice.getHeaders());

    if (retorno && retorno['codigo'] === 200) {

      this.limparAnuncio();
      this.homeservice.notifica('success', retorno['mensagem']);
      this.iniciaConfiguracoes();
    } else if (retorno && retorno['codigo'] === 201) {

      this.homeservice.notifica('warning', retorno['mensagem']);
    } else if (retorno && retorno['codigo'] === 401) {

      this.homeservice.renoveStorage('YR_TOKEN');
      this.verificaSessao();
    }
  }

  limparAnuncio() {

    this.cad.patchValue({codanu: null, desanu: null,
      prianu: null, status: null});
    this.arquivosSelecionadosList = [];
  }

  limparGenero() {

    this.cad.patchValue({codgen: null, tagger: null, pubger: null});
  }

  validaLado(lado, i, event) {

    let duplicado = this.arquivosSelecionadosList.findIndex(f => f.ladanu === lado);
    if ((duplicado > -1) && (duplicado !== i)) {

      this.homeservice.notifica('warning', 'Lado já selecionado!');
    }
  }

  trocarIndex(livro, capitulo, value, i) {
  
     capitulo.ordcap = value;
     if (livro.capitulosList.find((f, index) => (f.ordcap === value) && (index !== i))) {

      this.homeservice.notifica('warning', 'Ordem do Arquivo já Existente');
    }
     livro.capitulosList = _.orderBy(livro.capitulosList, 'ordcap', 'asc');
  }
  
  retornaNomeCampo(i, campo, x?) {

    return `${i}_${campo}${x? `_${x}` : ''}`;
  }

  async getGeneros() {

    this.verificaSessao();
    const retorno = await this.homeservice.getdeletehttp('get', `lista-generos/${this.cad.controls.codusu.value}`, this.homeservice.getHeaders());

    if (retorno && retorno['codigo'] === 200) {

      this.generosLivrosList = retorno['mensagem'];
    } else if (retorno && retorno['codigo'] === 201) {

      this.homeservice.notifica('warning', retorno['mensagem']);
    } else if (retorno && retorno['codigo'] === 401) {

      this.homeservice.renoveStorage('YR_TOKEN');
      this.verificaSessao();
    }
  }

  adicionarGenero(livro) {

    if (!livro.generosList.find(f => f.codgen === livro.vingen)) {

      livro.generosList.push({codliv: livro.codliv, codgen: livro.vingen, 
                              tagger: this.generosLivrosList.find(f => f.codigo === livro.vingen).descri});
    } else {

      this.homeservice.notifica('warning', 'Gênero/TAG já vinculado!');
    }
  }

  excluirGeneroLivro(i, livro) {

    livro.generosList.splice(i, 1);
  }

  transform(livro) {
    return this.domSanitizer.bypassSecurityTrustResourceUrl(`data:image/${livro.tiparq};base64,${livro.bas64s}`);
  }

  removerCapa(i) {

    this.livrosList[i].bas64s = null;
    this.livrosList[i].tiparq = null;
    this.homeservice.notifica('success', 'Capa do livro removida com sucesso!');
  }

  retornaCapitulos(livro) {

    return livro.capitulosList.filter(f => f.viscap === 'S').length;
  }

  adicionarCapitulo(livro) {
   
    livro.capitulosList.push({codcap: null, codliv: livro.codliv, numcap: null, 
      ordcap: livro.capitulosList.length > 0 ? (livro.capitulosList[livro.capitulosList.length - 1].ordcap + 1) : 1, 
      descap: null, viscap: 'S', datatu: null, numvie: 0, isColapse: false, adifav: true, insert_: true,
      arquivosList: []
    });
    this.homeservice.notifica('success', 'Capítulo adicionado com sucesso!');
  }

  expandirCapitulos(livro) {

    if (livro.visualizar) {

      livro.isColapse = !livro.isColapse;
    } else {

      livro.isColapse = true;
    }
  }

  excluirCapitulo(i, livro) {

    livro.capitulosList.splice(i, 1);
    this.homeservice.notifica('success', 'Capítulo removido com sucesso!');
  }

  expandirCapituloConfig(capitulo) {

    capitulo.isColapse = !capitulo.isColapse;
  }

  excluirArquivo(i, capitulo) {

    capitulo.arquivosList.splice(i, 1);
    this.homeservice.notifica('success', 'Arquivo removido com sucesso!');
  }

  trocarIndexArquivo(capitulo, arquivo, value, i) {
  
    arquivo.ordarq = value;
    if (capitulo.arquivosList.find((f, index) => (f.ordarq === value) && (index !== i))) {

      this.homeservice.notifica('warning', 'Ordem do Arquivo já Existente');
    }
    capitulo.arquivosList = _.orderBy(capitulo.arquivosList, 'ordarq', 'asc');
 }

 async salvarLivro() {

    this.verificaSessao();
    const retorno = await this.homeservice.postputhttp('post', 'salvar-livro', this.livrosList[0], this.homeservice.getHeaders());

    if (retorno && retorno['codigo'] === 200) {
      
      
      this.homeservice.notifica('success', retorno['mensagem']);
      this.minhasObras();
    } else if (retorno && retorno['codigo'] === 201) {

      this.homeservice.notifica('warning', retorno['mensagem']);
    } else if (retorno && retorno['codigo'] === 401) {

      this.homeservice.renoveStorage('YR_TOKEN');
      this.verificaSessao();
    }
  }

  async getLivros(pesquisa) {

    this.verificaSessao();
    let item = Object.assign({}, this.cad.value);
    let envioPesquisa = {...pesquisa, codusu: item.codusu};
    const retorno = await this.homeservice.postputhttp('post', 'get-livros', envioPesquisa, this.homeservice.getHeaders());

    if (retorno && retorno['codigo'] === 200) {

      if (pesquisa.tippes === 5) {

        this.capitulo = retorno['mensagem'][0];
      } else {

        this.livrosList = retorno['mensagem'];
      }
      if (this.livrosList.length === 0) {

        if (pesquisa.tippes === 1) {

          this.homeservice.notifica('info', 'Nenhuma obra existente!');
        } else if (pesquisa.tippes === 3) {

          this.homeservice.notifica('info', 'Nenhuma obra favoritada!');
        } else if (pesquisa.tippes === 4) {

          this.homeservice.notifica('info', 'Nenhuma pesquisa encontrada!');
        }
      }
    } else if (retorno && retorno['codigo'] === 201) {

      this.homeservice.notifica('warning', retorno['mensagem']);
    } else if (retorno && retorno['codigo'] === 401) {

      this.homeservice.renoveStorage('YR_TOKEN');
      this.verificaSessao();
    }
  }

  async salvarFavorito(livro) {

    livro.adifav = !livro.adifav;
    if (livro && livro.adifav && (livro.codusu === this.cad.controls.codusu.value)) {

      this.homeservice.notifica('warning', 'Não é possivel favoritar sua própria obra!');
      return;
    }
    this.verificaSessao();
    let item = Object.assign({}, this.cad.value);
    let objeto = {adifav: livro.adifav, codliv: livro.codliv, codusu: item.codusu };
    const retorno = await this.homeservice.postputhttp('post', 'salvar-favorito', objeto, this.homeservice.getHeaders());

    if (retorno && retorno['codigo'] === 200) {

      this.homeservice.notifica('success', retorno['mensagem']);
      this.favoritos();
    } else if (retorno && retorno['codigo'] === 201) {

      this.homeservice.notifica('warning', retorno['mensagem']);
    } else if (retorno && retorno['codigo'] === 401) {

      this.homeservice.renoveStorage('YR_TOKEN');
      this.verificaSessao();
    }
  }

  /* if (capa) {

    setTimeout(() => {

      let width = ((this.screenWidth / 100) * 19.16);
      let heigth = ((this.screenHeight / 100) * 19.16);
      let img = document.createElement('img');
      img.setAttribute('src', `data:image/${nameanx[nameanx.length - 1]};base64,${data}`);
      const screenWidth = d3.scaleLinear()
        .domain([0, this.screenWidth])
        .range([0, width]);
      const screenHeight = d3.scaleLinear()
        .domain([0, this.screenHeight])
        .range([0, heigth]);
      console.log('style', `height: ${Math.round(screenHeight(img.height))}px; width: ${Math.round(screenWidth(img.width))}px;`);
      let imagem = document.getElementById(`${i}_bas64s`);
      this.livrosList[i].style = `height: ${Math.round(screenHeight(img.height))}px; width: ${Math.round(screenWidth(img.width))}px;`;
    }, 50);
  } */
}
