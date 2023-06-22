import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class HomeServiceService {

  public url = 'http://localhost:10001/';
  constructor(
    private http: HttpClient,
    private toaster: ToastrService
  ) { }
  

  getdeletehttp(type: string, url: string, headers = {}) {
    const opts = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json; charset=ISO-8859-1',
        'Accept': '*/*',
        'Access-Control-Allow-Headers': '*',
        'YR_ID': this.getID(),
        'YR_HASH': this.geraHash(),
        ...headers
      })
    }
    return new Promise((resolve, reject) => {
      try {
        this.http[type](`${this.url}${url}`, opts).subscribe(
          data => {
            resolve(data)
          },
          error => {
            
            this.notifica('error', `${error.status || ''} - ${error.error.mensagem || 'Erro inválido!'}`);
            resolve(error);
          });
      } catch (error) {
        resolve(error);
      }
    })
  }

  postputhttp(type: string, url: string, object: any, headers = {}) {
    const opts = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json; charset=ISO-8859-1',
        'Accept': '*/*',
        'Access-Control-Allow-Headers': '*',
        'YR_ID': this.getID(),
        'YR_HASH': this.geraHash(),
        ...headers
      })
    }
    return new Promise((resolve, reject) => {
      try {
        this.http[type](`${this.url}${url}`, object, opts).subscribe(
          data => {
            resolve(data)
          },
          error => {

            this.notifica('error', `${error.status || ''} - ${error.error.mensagem || 'Erro inválido!'}`);
            resolve(error);
          });
      } catch (error) {
        resolve(error);
      }
    })
  }


  notifica(type, message, title?, config?) {

    this.toaster[type](message, (title || 'Youread diz: '), config);
  }


  geraId(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
  }

  configuraStorage() {

    let id = this.geraId(100);
    sessionStorage.setItem("YR_ID", id);
  }

  setStorage(id, codigo) {

    sessionStorage.setItem(id, codigo);
  }

  renoveStorage(id) {

    sessionStorage.removeItem(id);
  }

  getID(storage?) {

    return sessionStorage.getItem(storage || "YR_ID");
  }

  validaLoginSenha(token) {

    if (this.geraHash(token['codusu'] + this.getID() + this.geraHash()) === token['mensagem']) {

      sessionStorage.setItem("YR_TOKEN", token['mensagem']);
      return true;
    } else {

      return false;
    }
  }

  getHeaders () {

    return {
      'YR_COD': this.getID('YR_COD'),
      'YR_TOKEN': this.getID('YR_TOKEN')
    }
  }

  geraHash(valor?) {

    let id = this.getID();
    let encrypted = CryptoJS.SHA256(valor || id);
    return encrypted.toString();
  }

  encriptPromise(objeto, chave) {

    return new Promise((resolve, reject) => {

      try {

        let valida //= jwt.sign(objeto, chave);
        resolve(valida);
      } catch (error) {

        resolve({error: true, mensagem: JSON.stringify(error)})
      }
    })
  }
}
