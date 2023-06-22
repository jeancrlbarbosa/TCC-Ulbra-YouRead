let express = require('express');
let crypto = require("crypto");
let app  = express();
let moment = require('moment');;
const { Pool } = require('pg');
let client = null;
const path = __dirname;
const bodyParser = require('body-parser');
const email = require('./email');
const modelo = require('./model');
const _ = require('lodash');

exports.gerarHash = (texto) => {

    return crypto.Hash('sha256').update(texto).digest('hex');
}

exports.geraId = (length) => {
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


app.use(bodyParser.json({limit: '50mb', extended: true}))
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}))

app.use('/*', (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Allow-Credentials', true);
    if (req.method === 'OPTIONS') {

        return res.status(200).send('ok');
    }
    next();
});

app.use('/*', (req, res, next) => {
    
    if ((!req.baseUrl.includes('anuncio')) && (!req.baseUrl.includes('page'))) {

        if ((!req.headers['yr_id']) || (!req.headers['yr_hash'])) {

            return res.status(400).send({mensagem: 'Requisição Malformada!'});
        }
        let hash = this.gerarHash(req.headers['yr_id']);
        if (hash !== req.headers['yr_hash']) {
    
            return res.status(401).send({mensagem: 'Não Autorizado'});
        }
    }
    next();
})

exports.createConnection = () => {

    if (client === null) {

        client = new Pool({
            host: 'localhost',
            user: 'postgres',
            database: 'youread',
            password: '@youread',
            port: 5432
        });
        return client
    } else {

        return client
    }
}

exports.list = (client, comand, parameters = []) => {

    return new Promise((resolve, reject) => {

        client.query({text: comand, values: parameters}, (error, res) => {

            if (error) {

                resolve(error);
            }
            resolve((res ? (res.rowCount > 0 ? res.rows : null): null))
        })
    })
}

exports.insertUpdate = (client, comand, parameters = []) => {

    return new Promise((resolve, reject) => {

        client.query({text: comand, values: parameters}, (error, res) => {

            if (error) {

                resolve(error);
            }
            resolve(res);
        })
    })
}

exports.commandMultiple = async (client, list) => {

   return new Promise(async (resolve, reject) => {


        try {
            await client.query('BEGIN')
            for(let i = 0; i < list.length; i++) {
    
                await client.query(list[i].comand, list[i].parameters);
            }
            await client.query('COMMIT');
            resolve({codigo: 200});
          } catch (e) {
            await client.query('ROLLBACK');
            resolve(e);
          }
    })
}

exports.verificaConexaoUsuario = async (req) => {

    const hash = this.gerarHash(req.headers['yr_cod'] + req.headers['yr_id'] + req.headers['yr_hash'])
    if (hash === req.headers['yr_token']) {

        return false;
    } else {

        return true;
    }
}

app.post('/criar-usuario', async (req, res) => {
   
    const informacoes = await this.list(await this.createConnection(), 
        `select count(codusu) as logusu, 0 emausu from web_user where logusu = $1
        UNION ALL  
        select 0 as logusu, count(codusu) as emausu from web_user where emausu = $2;`,
        [req.body.logusu, req.body.emausu]);

    if (informacoes && informacoes.length) {

        if (informacoes.find(f => f.logusu > 0)) {

            return res.status(200).send({codigo: 201, mensagem: 'Username já cadastrado!'});
        } else if (informacoes.find(f => f.emausu > 0)) {

            return res.status(200).send({codigo: 201, mensagem: 'E-mail já cadastrado!'});
        }
    }


    const retorno = await this.insertUpdate(await this.createConnection(), 
    `insert into web_user (logusu, pashas, nomusu, nomaut, apanom, monace, tipusu, emausu, cnpjpf) 
     values ( $1, $2, $3, $4, $5, $6, $7, $8, $9 )`,
    [req.body.logusu, req.body.pashas, req.body.nomusu, (req.body.nomaut || null), (req.body.apanom || null), 'N', 
     req.body.tipusu, req.body.emausu, (req.body.cnpjpf || null)]);


    if (retorno && (retorno.rowCount > 0)) {

        return res.status(200).send({codigo: 200, mensagem: 'Usuário cadastrado com sucesso!'});
    } else {

        return res.status(500).send({ mensagem: 'Erro ao cadastrar usuário!'});
    }
});

app.post('/login', async (req, res) => {
   
        let usuario = await this.list(await this.createConnection(), 
            `select codusu, logusu, pashas from web_user where logusu = $1;`,
            [req.body.logusu]);

        if (usuario && usuario.length) {

            if (usuario.length > 0) {

                usuario = usuario[0];
                const hash = this.gerarHash(usuario.pashas + req.headers['yr_id'] + req.headers['yr_hash']);
                if (hash === req.body.pashas) {

                    return res.status(200).send({codigo: 200, mensagem: this.gerarHash(usuario.codusu + req.headers['yr_id'] + req.headers['yr_hash']), codusu: usuario.codusu});
                } else {

                    return res.status(200).send({codigo: 201, mensagem: 'Username ou Senha inválidos!'});
                }
            } else if (usuario.find(f => f.emausu > 0)) {

                return res.status(200).send({codigo: 201, mensagem: 'Usuário inválido ou inexistente!'});
            }
        } else {

            return res.status(200).send({codigo: 201, mensagem: 'Usuário inválido ou inexistente!'});
        }
});


app.post('/recuperar-senha', async (req, res) => {
   
    const informacoes = await this.list(await this.createConnection(), 
        `select codusu, logusu from web_user where emausu = $1;`,
        [req.body.emausu]);

    if (informacoes && informacoes.length && (informacoes.length > 0)) {

        const atual = moment();
        const horaIni = atual.format('YYYY-MM-DD HH:mm');
        const horaFim = atual.add(+3, 'minutes').format('YYYY-MM-DD HH:mm');
        const codigoAcesso = this.geraId(6).toUpperCase();
        let codrec = `${horaIni}/${this.gerarHash(codigoAcesso + req.headers['yr_id'] + req.headers['yr_hash'])}/${horaFim}/${req.headers['yr_id'] + req.headers['yr_hash']}`;
         
        const retorno = await this.insertUpdate(await this.createConnection(), 
            `UPDATE web_user SET codrec = $1 WHERE codusu = $2`,
            [codrec, informacoes[0].codusu]);


            if (retorno && (retorno.rowCount > 0)) {

                const retornoEmail = email.iniciaEnvioEmail({

                    html: modelo.modeloEmail(
                    `Olá ${informacoes[0].logusu}, segue abaixo seu código de recuperação de senha. Lembrando que este código tem validade de 3 minutos!`
                    , codigoAcesso),
                    from: process.env.EMAIl,
                    to: [req.body.emausu],
                    subject: 'YOUREAD - RECUPERAÇÃO DE SENHA'
                })
                return res.status(200).send({codigo: 200, mensagem: 'Código de recuperação de senha gerado com sucesso! O código será enviado ao e-mail e terá validade de 3 minutos.'});
            } else {

                return res.status(500).send({ mensagem: 'Erro ao gerar código de recuperação de senha!'});
            }
    } else {

        return res.status(200).send({codigo: 201, mensagem: 'E-mail inválido!'});
    }
});


app.post('/verifica-codigo', async (req, res) => {
   
    const informacoes = await this.list(await this.createConnection(), 
        `select codusu, codrec from web_user where codrec LIKE $1`,
        ['%' + req.headers['yr_id'] + req.headers['yr_hash'] + '%']);

    if (informacoes && informacoes.length && (informacoes.length > 0) && (informacoes && informacoes[0].codrec)) {

        const atual = moment();
        const separado = informacoes[0].codrec.split('/');

        if (atual.isSameOrAfter(moment(separado[0], 'YYYY-MM-DD HH:mm')) && atual.isSameOrBefore(moment(separado[2], 'YYYY-MM-DD HH:mm')) &&
            (`${separado[0]}/${this.gerarHash(req.body.codrec + req.headers['yr_id'] + req.headers['yr_hash'])}/${separado[2]}/${req.headers['yr_id'] + req.headers['yr_hash']}` === informacoes[0].codrec)) {


            this.insertUpdate(await this.createConnection(), 
            `UPDATE web_user SET codrec = $1 WHERE codusu = $2`, [this.gerarHash(req.body.codrec + req.headers['yr_id'] + req.headers['yr_hash']), informacoes[0].codusu]);

            return res.status(200).send({codigo: 200, mensagem: 'Código de recuperação validado com sucesso!'});
        } else {

            return res.status(200).send({codigo: 201, mensagem: 'Código de recuperação expirado ou inválido!'});
        }
    } else {

        return res.status(200).send({codigo: 201, mensagem: 'Nenhuma solicitação de recuperação de senha requerida!'});
    }
});


app.post('/salvar-senha', async (req, res) => {
   
    const informacoes = await this.list(await this.createConnection(), 
        `select codusu, codrec from web_user where codrec = $1`,
        [this.gerarHash(req.body.codrec + req.headers['yr_id'] + req.headers['yr_hash'])]);

    if (informacoes && informacoes.length && (informacoes.length > 0)) {

        if (this.gerarHash(req.body.pashas + req.body.pasha2 + req.headers['yr_id'] + req.headers['yr_hash']) === req.body.pasha3) {

            const retorno = await this.insertUpdate(await this.createConnection(), 
            `UPDATE web_user SET pashas = $1, codrec = $2 WHERE codusu = $3`, [req.body.pashas, null, informacoes[0].codusu]);
            if (retorno && (retorno.rowCount > 0)) {
    
                return res.status(200).send({codigo: 200, mensagem: 'Nova senha salva com sucesso!'});
            } else {
    
                return res.status(500).send({ mensagem: 'Erro ao salvar nova senha!'});
            }
        } else {

            return res.status(500).send({ mensagem: 'Nova senha inválida!'})
        }
    } else {

        return res.status(200).send({codigo: 201, mensagem: 'Nenhuma solicitação de recuperação de senha requerida!'});
    }
});

app.get('/configuracoes-usuario', async (req, res) => {
   
    if (await this.verificaConexaoUsuario(req)) {

        return res.status(200).send({codigo: 401, mensagem: 'Usuário logado em sessão diferente!'});
    }
    let usuario = await this.list(await this.createConnection(), 
                `select * from web_user where codusu = $1`,
                [req.headers['yr_cod']]);
    if (usuario && usuario.length && (usuario.length > 0)) {
        usuario = usuario[0];
        delete usuario.codrec;
        delete usuario.pashas;

        if (usuario.tipusu === 'A') {

            const permiteMonetizacao = await this.list(await this.createConnection(),
                `WITH agrupado AS ( 
                    SELECT a.codusu FROM web_view_livros a 
                    INNER JOIN web_livros b ON a.codliv = b.codliv 
                    WHERE b.codusu = $1 GROUP BY a.codusu 
                ) 
                SELECT COUNT(codusu) as contagem FROM agrupado;`, [usuario.codusu]);
            if (((usuario.monace === 'S') || (Array.isArray(permiteMonetizacao) && (permiteMonetizacao[0] && (Number(permiteMonetizacao[0].contagem) >= 10))))) {

                usuario.permon = 'S';
            }
            const requisitaMonetizacao = await this.list(await this.createConnection(),
                    `select * from web_requisita_monetizacao where codusu = $1 order by datreq`, [usuario.codusu]);
            if (Array.isArray(requisitaMonetizacao)) { 
                usuario.requisitaMonetizacaoList = requisitaMonetizacao
                if(requisitaMonetizacao.find(f => f.status === 'A')) {

                    usuario.reqace = 'S'
                } 
            }

            const generos = await this.list(await this.createConnection(),
                `select * from web_generos where codusu = $1 order by codgen`, [usuario.codusu]);
            if (Array.isArray(generos)) { usuario.generosList = generos }
        }
        if (usuario.tipusu === 'S') {

            const anuncios = await this.list(await this.createConnection(),
                `select a.*, b.ladanu, b.bas64s, b.tiparq  from web_anuncios a 
                LEFT JOIN web_anuncio_arquivo b ON a.codanu = b.codanu 
                where a.codusu = $1 order by a.codanu, a.status ASC`, [usuario.codusu]);
            if (Array.isArray(anuncios)) {
                let anunciosList = [];
                let anunciosAgrupados = _.groupBy(anuncios, 'codanu');
                _.forOwn(anunciosAgrupados, (value, key) => {

                    let objeto = {
                        codanu: value[0].codanu, prianu: value[0].prianu,
                        desanu: value[0].desanu, status: value[0].status,
                        arquivosList: []
                    };
                    _.forEach(value, (element) => {

                        objeto.arquivosList.push({
                            codanu: element.codanu, ladanu: element.ladanu,
                            bas64s: element.bas64s, tiparq: element.tiparq
                        });
                    });
                    anunciosList.push(objeto);
                });
                usuario.anunciosList = anunciosList;
            }
        }

        return res.status(200).send({ codigo: 200, mensagem: usuario });
    } else {

        return res.status(200).send({ codigo: 401, mensagem: 'Usuário inexistente!' });
    }
});

app.post('/salvar-perfil', async (req, res) => {


    if (await this.verificaConexaoUsuario(req)) {

        return res.status(200).send({codigo: 401, mensagem: 'Usuário logado em sessão diferente!'});
    }
    if (Number(req.body.codusu) === Number(req.headers['yr_cod'])) {

        const informacoes = await this.list(await this.createConnection(),
            `select count(codusu) as logusu, 0 emausu from web_user where logusu = $1 AND codusu <> $3
            UNION ALL  
            select 0 as logusu, count(codusu) as emausu from web_user where emausu = $2 AND codusu <> $3;`,
            [req.body.logusu, req.body.emausu, req.body.codusu]);

        if (informacoes && informacoes.length) {

            if (informacoes.find(f => f.logusu > 0)) {

                return res.status(200).send({ codigo: 201, mensagem: 'Username já cadastrado!' });
            } else if (informacoes.find(f => f.emausu > 0)) {

                return res.status(200).send({ codigo: 201, mensagem: 'E-mail já cadastrado!' });
            }
        }
        const retorno = await this.insertUpdate(await this.createConnection(), 
        `update web_user set logusu = $1, nomusu = $2, emausu = $3, tipusu = $4,  
                             nomaut = $5, apanom = $6, cnpjpf = $7, monace = $8 
         WHERE codusu = $9;`,
        [req.body.logusu,req.body.nomusu, req.body.emausu, req.body.tipusu, 
        (req.body.nomaut || null), (req.body.apanom || null), (req.body.cnpjpf || null), 
        (req.body.monace || 'N'), req.body.codusu]);

        if (retorno && (retorno.rowCount > 0)) {

            return res.status(200).send({codigo: 200, mensagem: 'Usuário alterado com sucesso!'});
        } else {

            return res.status(500).send({ mensagem: 'Erro ao alterar usuário!'});
        }
    } else {

        return res.status(200).send({ codigo: 401, mensagem: 'Usuário diferente do logado!' })
    }
});

app.post('/salvar-senha-configuracoes', async (req, res) => {


    if (await this.verificaConexaoUsuario(req)) {

        return res.status(200).send({codigo: 401, mensagem: 'Usuário logado em sessão diferente!'});
    }
    if (Number(req.body.codusu) === Number(req.headers['yr_cod'])) {


        if ((req.body.pashas !== req.body.pasha2) || (req.body.pashas !== req.body.pasha3)) {

            return res.status(200).send({codigo: 201, mensagem: 'Senhas não são iguais!'});
        }
        const retorno = await this.insertUpdate(await this.createConnection(), 
        `update web_user set pashas = $1
         WHERE codusu = $2;`,
        [req.body.pashas, req.body.codusu]);

        if (retorno && (retorno.rowCount > 0)) {

            return res.status(200).send({codigo: 200, mensagem: 'Senha do usuário alterada com sucesso!'});
        } else {

            return res.status(500).send({ mensagem: 'Erro ao salvar nova senha do usuário!'});
        }
    } else {

        return res.status(200).send({ codigo: 401, mensagem: 'Usuário diferente do logado!' })
    }
});

app.post('/salvar-requisicao-moentizacao', async (req, res) => {


    if (await this.verificaConexaoUsuario(req)) {

        return res.status(200).send({codigo: 401, mensagem: 'Usuário logado em sessão diferente!'});
    }
    if (Number(req.body.codusu) === Number(req.headers['yr_cod'])) {


        const retorno = await this.insertUpdate(await this.createConnection(), 
        `INSERT INTO web_requisita_monetizacao (codusu, motmon) VALUES ($1, $2);`,
        [req.body.codusu, req.body.motmon]);

        if (retorno && (retorno.rowCount > 0)) {

            return res.status(200).send({codigo: 200, mensagem: 'Solicitação de monetização salva com sucesso!'});
        } else {

            return res.status(500).send({ mensagem: 'Erro ao salvar solicitação de monetização!'});
        }
    } else {

        return res.status(200).send({ codigo: 401, mensagem: 'Usuário diferente do logado!' })
    }
});

app.post('/salvar-genero', async (req, res) => {


    if (await this.verificaConexaoUsuario(req)) {

        return res.status(200).send({codigo: 401, mensagem: 'Usuário logado em sessão diferente!'});
    }
    if (Number(req.body.codusu) === Number(req.headers['yr_cod'])) {

        let comando = '';
        let lista = [];
        if (req.body.codgen) {

            comando = `UPDATE web_generos SET tagger = $1, pubger = $2 WHERE codgen = $3;`;
            lista = [req.body.tagger, req.body.pubger, req.body.codgen];
        } else {

            comando = `INSERT INTO web_generos (tagger, pubger, codusu) VALUES ($1, $2, $3);`;
            lista = [req.body.tagger, req.body.pubger, req.body.codusu];
        }
        const retorno = await this.insertUpdate(await this.createConnection(), 
        comando,
        lista);

        if (retorno && (retorno.rowCount > 0)) {

            return res.status(200).send({codigo: 200, mensagem: `Gênero/Tag salvo com sucesso!`});
        } else {

            return res.status(500).send({ mensagem: 'Erro ao salvar gênero/tag!'});
        }
    } else {

        return res.status(200).send({ codigo: 401, mensagem: 'Usuário diferente do logado!' })
    }
});

app.delete('/delete-genero/:codusu/:codgen', async (req, res) => {


    if (await this.verificaConexaoUsuario(req)) {

        return res.status(200).send({codigo: 401, mensagem: 'Usuário logado em sessão diferente!'});
    }
    if (Number(req.params.codusu) === Number(req.headers['yr_cod'])) {

        const retorno = await this.insertUpdate(await this.createConnection(), 
        `DELETE FROM web_generos WHERE codgen = $1`,
        [req.params.codgen]);

        if (retorno && (retorno.rowCount > 0)) {

            return res.status(200).send({codigo: 200, mensagem: 'Gênero/Tag de deletado com sucesso!'});
        } else {

            return res.status(500).send({ mensagem: 'Erro ao deletar gênero/tag!'});
        }
    } else {

        return res.status(200).send({ codigo: 401, mensagem: 'Usuário diferente do logado!' })
    }
});

app.post('/salvar-anuncio', async (req, res) => {


    if (await this.verificaConexaoUsuario(req)) {

        return res.status(200).send({codigo: 401, mensagem: 'Usuário logado em sessão diferente!'});
    }
    if (Number(req.body.codusu) === Number(req.headers['yr_cod'])) {

        let transaction = [];
        if (req.body.codanu) {

            transaction.push({comand: `UPDATE web_anuncios SET prianu = $1, desanu = $2, status = $3 WHERE codanu = $4;`,
                              parameters: [req.body.prianu, req.body.desanu, req.body.status, req.body.codanu]});
        } else {

            transaction.push({comand: `INSERT INTO web_anuncios (codusu, prianu, desanu, status) VALUES ($1, $2, $3, $4);`,
                              parameters: [req.body.codusu, req.body.prianu, req.body.desanu, req.body.status]});

            for (let i = 0; i < req.body.arquivosList.length; i++) {


                transaction.push({comand: `INSERT INTO web_anuncio_arquivo (codanu, ladanu, bas64s, tiparq) VALUES ((SELECT last_value FROM web_anuncios_codanu_seq), $1, $2, $3);`,
                              parameters: [req.body.arquivosList[i].ladanu, req.body.arquivosList[i].bas64s, req.body.arquivosList[i].tiparq]});
            }            
        }
        const retorno = await this.commandMultiple(await this.createConnection(), transaction);

        if (retorno && (retorno.codigo === 200)) {

            return res.status(200).send({codigo: 200, mensagem: `Anúncio salvo com sucesso!`});
        } else {

            return res.status(500).send({ mensagem: 'Erro ao salvar anúncio!'});
        }
    } else {

        return res.status(200).send({ codigo: 401, mensagem: 'Usuário diferente do logado!' })
    }
});

app.delete('/delete-anuncio/:codusu/:codanu', async (req, res) => {


    if (await this.verificaConexaoUsuario(req)) {

        return res.status(200).send({codigo: 401, mensagem: 'Usuário logado em sessão diferente!'});
    }
    if (Number(req.params.codusu) === Number(req.headers['yr_cod'])) {

        const anunciosView = await this.list(await this.createConnection(),
                `select COUNT(codusu) as contagem from web_view_livros where  ((codanu_l = $1) OR (codanu_r = $1))`, [req.params.codanu]);
        if (Array.isArray(anunciosView)) { 

            if (anunciosView[0] && (Number(anunciosView[0].contagem) > 0)) {

                return res.status(200).send({codigo: 201, mensagem: 'Anúncio já foi visualizado não pode ser mais excluido! Favor desative ele caso deseje.'});
            }
        }

        const retorno = await this.commandMultiple(await this.createConnection(), 
        [{comand: `DELETE FROM web_anuncios WHERE codanu = $1;`, parameters: [req.params.codanu]}, 
         {comand: `DELETE FROM web_anuncio_arquivo where codanu = $1;`, parameters: [req.params.codanu]}]);

        if (retorno && (retorno.codigo === 200)) {

            return res.status(200).send({codigo: 200, mensagem: 'Anúncio de deletado com sucesso!'});
        } else {

            return res.status(500).send({ mensagem: 'Erro ao deletar anúncio!'});
        }
    } else {

        return res.status(200).send({ codigo: 401, mensagem: 'Usuário diferente do logado!' })
    }
});

app.get('/lista-generos/:codusu', async (req, res) => {
   

    if (await this.verificaConexaoUsuario(req)) {

        return res.status(200).send({codigo: 401, mensagem: 'Usuário logado em sessão diferente!'});
    }
    if (Number(req.params.codusu) === Number(req.headers['yr_cod'])) {

        let retorno = [];
        const generos = await this.list(await this.createConnection(),
                `select codgen as codigo, tagger as descri 
                 from web_generos where ((codusu = $1) OR (codusu is null AND pubger = 'S')) order by codgen`, [req.params.codusu]);
        if (Array.isArray(generos)) { retorno = generos; }
        res.status(200).send({ codigo: 200, mensagem: retorno });
    } else {

        return res.status(200).send({ codigo: 401, mensagem: 'Usuário diferente do logado!' });
    }
});

app.post('/salvar-livro', async (req, res) => {


    if (await this.verificaConexaoUsuario(req)) {

        return res.status(200).send({codigo: 401, mensagem: 'Usuário logado em sessão diferente!'});
    }
    if (Number(req.body.codusu) === Number(req.headers['yr_cod'])) {

        let transaction = [];
        if (req.body.codliv) {

            transaction.push({comand: `UPDATE web_livros SET habmon = $1, titulo = $2, desliv = $3,  
                                                             visliv = $4, bas64s = $5, tiparq = $6 
                                        WHERE codliv = $7 ;`,
                              parameters: [req.body.habmon, req.body.titulo, (req.body.desliv || null), 
                                           req.body.visliv, (req.body.bas64s || null), (req.body.tiparq || null),
                                           req.body.codliv]});
        } else {

            transaction.push({comand: `insert into web_livros (codusu, habmon, titulo, datcri, desliv, visliv, bas64s, tiparq)  
                                       VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`,
                              parameters: [req.body.codusu, req.body.habmon, req.body.titulo, moment().format('YYYYY-MM-DD'), 
                                           (req.body.desliv || null), req.body.visliv, (req.body.bas64s || null), (req.body.tiparq || null)]});         
        }

        if (req.body.generosList.length > 0) {

            if (req.body.codliv) {

                transaction.push({comand: `DELETE FROM web_tag_livro WHERE codliv = $1;`,
                parameters: [req.body.codliv]}); 
            }
            req.body.generosList.forEach((element, index) => { 

                let parameters = [element.codgen];
                if (req.body.codliv) {

                    parameters.push(element.codliv);
                }
                transaction.push({comand: `insert into web_tag_livro (codliv, codgen) 
                                            VALUES (${!req.body.codliv ? '(SELECT last_value FROM web_livros_codliv_seq)' : '$2'}, $1);`,
                        parameters: parameters}); 
            });
        } 
        
        let capitulosJaInseridos = req.body.capitulosList.filter(f => f.codcap);
        let capitulosNovos = req.body.capitulosList.filter(f => !f.codcap);

        if (capitulosJaInseridos.length > 0) {

           let condicao = '';
           capitulosJaInseridos.forEach((element, index) => {

            if (element.arquivosList.length > 0) {

                transaction.push({
                    comand: `UPDATE web_capitulos SET numcap = $1, ordcap = $2, descap = $3, 
                                                  datatu = $4, viscap = $5 
                            WHERE codcap = $6 ;`,
                    parameters: [element.numcap, element.ordcap, (element.descap || null),
                                 moment().format('YYYYY-MM-DD'), element.viscap, 
                                 element.codcap]
                });
                transaction.push({comand: `DELETE FROM web_arquivos WHERE codcap = $1 ;`,
                            parameters: [element.codcap]}); 
                element.arquivosList.forEach((arquivo, indexArq) => { 

                    transaction.push({comand: `insert into web_arquivos (codcap, bas64s, ordarq, tiparq, nomarq) 
                                               VALUES ($1, $2, $3, $4, $5);`,
                            parameters: [arquivo.codcap, arquivo.bas64s, arquivo.ordarq, arquivo.tiparq, arquivo.nomarq]}); 
                });
            }
            condicao += `${index > 0 ? ' AND ' : ''} codcap <> ${element.codcap}`;
           });
           transaction.push({comand: `DELETE FROM web_capitulos WHERE (${condicao}) AND codliv = $1 ;`,
                            parameters: [req.body.codliv]}); 
        }

        if (capitulosNovos.length > 0) {

            capitulosNovos.forEach((element, index) => {

                let parameters = [element.numcap, element.ordcap,(element.descap || null),
                                  moment().format('YYYYY-MM-DD'), element.viscap];
                if (req.body.codliv) {

                    parameters.push(element.codliv);
                }
                transaction.push({
                    comand: `insert into web_capitulos (numcap, ordcap, codliv, descap, datatu, viscap) 
                            VALUES ($1, $2, 
                                    ${!req.body.codliv ? '(SELECT last_value FROM web_livros_codliv_seq)' : '$6'}, 
                                    $3, $4, $5);`,
                    parameters: parameters
                });
                if (element.arquivosList.length > 0) {

                    element.arquivosList.forEach((arquivo, indexArq) => {

                        transaction.push({
                            comand: `insert into web_arquivos (codcap, bas64s, ordarq, tiparq, nomarq) 
                                                   VALUES ((SELECT last_value FROM web_capitulos_codcap_seq),
                                                           $1, $2, $3, $4);`,
                            parameters: [arquivo.bas64s, arquivo.ordarq, arquivo.tiparq, arquivo.nomarq]
                        });
                    });
                }
            });
        }
        const retorno = await this.commandMultiple(await this.createConnection(), transaction);

        if (retorno && (retorno.codigo === 200)) {

            return res.status(200).send({codigo: 200, mensagem: `Livro salvo com sucesso!`});
        } else {

            return res.status(500).send({ mensagem: 'Erro ao salvar livro!'});
        }
    } else {

        return res.status(200).send({ codigo: 401, mensagem: 'Usuário diferente do logado!' })
    }
});

app.post('/get-livros', async (req, res) => {


    if (await this.verificaConexaoUsuario(req)) {

        return res.status(200).send({codigo: 401, mensagem: 'Usuário logado em sessão diferente!'});
    }
    if (Number(req.body.codusu) === Number(req.headers['yr_cod'])) {

        let retorno = [];
        let comand = `WITH livros AS (SELECT
        liv.codliv as liv_codliv, liv.codusu as liv_codusu, liv.habmon as liv_habmon, liv.titulo as liv_titulo, liv.datcri as liv_datcri, 
        liv.desliv as liv_desliv, liv.visliv as liv_visliv, liv.bas64s as liv_bas64s, liv.tiparq as liv_tiparq,
        
        (CASE WHEN use.apanom = 'S' AND use.nomaut IS NOT NULL THEN use.nomaut ELSE use.nomusu END) as use_nomaut, 
        
        cap.codcap as cap_codcap, cap.numcap as cap_numcap, cap.ordcap as cap_ordcap, cap.codliv as cap_codliv, cap.descap as cap_descap, 
        cap.datatu as cap_datatu, cap.viscap as cap_viscap,
        
        arq.codcap as arq_codcap, arq.bas64s as arq_bas64s, arq.ordarq as arq_ordarq, arq.tiparq as arq_tiparq, arq.nomarq as arq_nomarq, 
        
        tag.codliv as tag_codliv, tag.codgen as tag_codgen, gen.tagger as tag_tagger, 
        
        staliv.valace as sta_valace, stacap.numvie as sta_numvie 
        
        FROM web_livros liv 
        INNER JOIN web_user use ON liv.codusu = use.codusu
        INNER JOIN web_capitulos cap ON liv.codliv = cap.codliv 
        INNER JOIN web_arquivos arq ON cap.codcap = arq.codcap 
        INNER JOIN web_tag_livro tag ON liv.codliv = tag.codliv 
        INNER JOIN web_generos gen ON tag.codgen = gen.codgen 
        [favorito] 
        LEFT JOIN LATERAL (SELECT COUNT(sta.codliv) as valace FROM web_view_livros sta WHERE sta.codliv = liv.codliv) AS staliv ON true 
        LEFT JOIN LATERAL (SELECT COUNT(sta.codcap) as numvie FROM web_view_livros sta WHERE sta.codcap = cap.codcap AND sta.codliv = liv.codliv) AS stacap ON true 
        WHERE [where]  
        ORDER BY liv.titulo ASC, cap.ordcap ASC, arq.ordarq ASC, gen.tagger ASC) 
        SELECT * FROM livros [pesquisaAutor];`;
        let parameters = [];
        if (req.body.tippes === 1) {

            let where = 'liv.codusu = $1';
            parameters = [req.body.codusu];
            comand = comand.split('[where]').join(where);
        } else if (req.body.tippes === 2) {

            let where = 'liv.codliv = $1 ';
            parameters = [req.body.codliv];
            comand = comand.split('[where]').join(where);
        } else if (req.body.tippes === 3) {

            let favorito = 'INNER JOIN web_user_favoritos fav ON fav.codliv = liv.codliv';
            let where = `fav.codusu = $1 AND liv.visliv = 'S' AND cap.viscap = 'S' `;
            parameters = [req.body.codusu];
            comand = comand.split('[favorito]').join(favorito);
            comand = comand.split('[where]').join(where);
        } else if (req.body.tippes === 4) {

            let where = '';
            let pesquisaAutor = '';
            let pesquisaAgrupada = req.body.pesquisa.split(' ').join('');
            let separado = pesquisaAgrupada.split('#').filter(f => f.length > 0);
            separado.forEach((element, index) => {

                let autor = element.includes('criador:') && (element.split('criador:').length === 2) && (element.split('criador:')[0].length === 0);
                if (autor) {

                    pesquisaAutor += `${pesquisaAutor.length > 0 ? ' OR ' : ''} ((use_nomaut = '${element.split('criador:')[1]}') OR (use_nomaut like '%${element.split('criador:')[1]}%')) `;
                } else {

                    where += `${where.length > 0 ? ' OR ' : ''} ((gen.tagger = '${element}') OR (gen.tagger like '%${element}%')) `;
                }
            });
            if (where.length > 0) { comand = comand.split('[where]').join(`(${where}) AND liv.visliv = 'S' AND cap.viscap = 'S' `); };
            if (pesquisaAutor.length > 0) { comand = comand.split('[pesquisaAutor]').join(`WHERE (${pesquisaAutor})`); };
        } else if (req.body.tippes === 5) {

            let where = `liv.codliv = $1 AND liv.visliv = 'S' AND cap.viscap = 'S'`;
            parameters = [req.body.codliv];
            comand = comand.split('[where]').join(where);
        }

        comand = comand.split('[favorito]').join('');
        comand = comand.split('[where]').join('');
        comand = comand.split('[pesquisaAutor]').join('');

        let livros = await this.list(await this.createConnection(), comand, parameters);
        if (Array.isArray(livros)) { 

            let proximo = null;
            let anterior = null;
            let anunciosD = null;
            let anunciosE = null;
            if (req.body.tippes === 5) {

                let ordenado = _.orderBy(livros, 'cap_ordcap', 'asc');
                let capitulo = ordenado.find(f => f.cap_codcap === req.body.codcap);
                let proximoCapitulo = ordenado.find(f => f.cap_ordcap > capitulo.cap_ordcap)
                if (proximoCapitulo) { proximo = proximoCapitulo.cap_codcap };
                let anteriorCapitulo = ordenado.find(f => f.cap_ordcap < capitulo.cap_ordcap)
                if (anteriorCapitulo) { anterior = anteriorCapitulo.cap_codcap };
                livros = livros.filter(f => f.cap_codcap === capitulo.cap_codcap);

                let anuncios = await this.list(await this.createConnection(), 
                
                    `with livro_stats as (select liv.codusu, stat.codliv, `
                    +`(CASE WHEN COALESCE(COUNT(stat.codcap), 0) = 0 THEN 0 ELSE ((COALESCE(COUNT(stat.codcap), 0))::float / 7) END) meddia, COUNT(stat.codcap) `
                    +`from web_livros liv `
                    +`inner join web_capitulos cap ON cap.codliv = liv.codliv `
                    +`left join web_view_livros stat ON stat.codliv = liv.codliv AND stat.datvie >= (CURRENT_DATE - 7) `
                    +`where liv.habmon = 'S' AND liv.codliv = $1 AND cap.codcap = $2 group by liv.codusu, stat.codliv), `
                    
                    +`anuncios_stats_baixo as (select `
                    +`anu.codanu, SUM(CASE WHEN arq.ladanu = 'D' THEN 1 ELSE 0 END) as dirarq, SUM(CASE WHEN arq.ladanu = 'E' THEN 1 ELSE 0 END) as esqarq, `
                    +`SUM(COALESCE(dir.contagem, 0)) as cont_r, SUM(COALESCE(esq.contagem, 0)) as cont_l FROM web_anuncios anu `
                    +`inner join web_anuncio_arquivo arq On anu.codanu = arq.codanu `
                    +`left join lateral (select count(stat.codanu_r) as contagem from (select 1 as codigo) gen_ `
                    +`INNER JOIN web_view_livros stat ON gen_.codigo = 1 `
                    +`where stat.codanu_r = anu.codanu AND arq.ladanu = 'D' and DATE(stat.datvie) = CURRENT_DATE) as dir ON true `
                    +`left join lateral (select count(stat.codanu_l) as contagem from (select 1 as codigo) gen_ `
                    +`INNER JOIN web_view_livros stat ON gen_.codigo = 1 `
                    +`where stat.codanu_l = anu.codanu AND arq.ladanu = 'E' and DATE(stat.datvie) = CURRENT_DATE) as esq ON true `
                    +`WHERE  anu.prianu = 'B' AND anu.status = 'A' GROUP BY anu.codanu), `
                    
                    +`media_anuncios_baixo as (select stat.*, `
                    +`(CASE WHEN stat.cont_r = 0 THEN 0 ELSE (((stat.cont_r)::float * 100)::float / tot.cont_r) END) dirmed, `
                    +`(CASE WHEN stat.cont_l = 0 THEN 0 ELSE (((stat.cont_l)::float * 100)::float / tot.cont_r) END) esqmed `
                    +`from anuncios_stats_baixo stat `
                    +`left join lateral (select SUM(cont_r) as cont_r, SUM(cont_l) as cont_l FROM anuncios_stats_baixo) as tot ON true), `
                    
                    +`anuncio_baixo as (select dir.codanu as codanu_r, esq.codanu as codanu_l, 'B' as prianu from livro_stats cap `
                    +`left join lateral (select stat.codanu, stat.dirmed from media_anuncios_baixo stat where dirarq = 1 order by stat.dirmed asc fetch first 1 rows only) as dir ON true `
                    +`left join lateral (select stat.codanu, stat.esqmed from media_anuncios_baixo stat where esqarq = 1 order by stat.esqmed asc fetch first 1 rows only) as esq ON true `
                    +`where cap.meddia <= 5), `
                    
                    +`anuncios_stats_medio as (select `
                    +`anu.codanu, SUM(CASE WHEN arq.ladanu = 'D' THEN 1 ELSE 0 END) as dirarq, SUM(CASE WHEN arq.ladanu = 'E' THEN 1 ELSE 0 END) as esqarq, `
                    +`SUM(COALESCE(dir.contagem, 0)) as cont_r, SUM(COALESCE(esq.contagem, 0)) as cont_l FROM web_anuncios anu `
                    +`inner join web_anuncio_arquivo arq On anu.codanu = arq.codanu `
                    +`left join lateral (select count(stat.codanu_r) as contagem from (select 1 as codigo) gen_ `
                    +`INNER JOIN web_view_livros stat ON gen_.codigo = 1 `
                    +`where stat.codanu_r = anu.codanu AND arq.ladanu = 'D' and DATE(stat.datvie) = CURRENT_DATE) as dir ON true `
                    +`left join lateral (select count(stat.codanu_l) as contagem from (select 1 as codigo) gen_ `
                    +`INNER JOIN web_view_livros stat ON gen_.codigo = 1 `
                    +`where stat.codanu_l = anu.codanu AND arq.ladanu = 'E' and DATE(stat.datvie) = CURRENT_DATE) as esq ON true `
                    +`WHERE  anu.prianu = 'M' AND anu.status = 'A' GROUP BY anu.codanu), `
                    
                    +`media_anuncios_medio as (select stat.*, `
                    +`(CASE WHEN stat.cont_r = 0 THEN 0 ELSE (((stat.cont_r)::float * 100)::float / tot.cont_r) END) dirmed, `
                    +`(CASE WHEN stat.cont_l = 0 THEN 0 ELSE (((stat.cont_l)::float * 100)::float / tot.cont_r) END) esqmed `
                    +`from anuncios_stats_medio stat `
                    +`left join lateral (select SUM(cont_r) as cont_r, SUM(cont_l) as cont_l FROM anuncios_stats_medio) as tot ON true), `
                    
                    +`anuncio_medio as (select dir.codanu as codanu_r, esq.codanu as codanu_l, 'M' as prianu from livro_stats cap `
                    +`left join lateral (select stat.codanu, stat.dirmed from media_anuncios_medio stat where dirarq = 1 order by stat.dirmed asc fetch first 1 rows only) as dir ON true `
                    +`left join lateral (select stat.codanu, stat.esqmed from media_anuncios_medio stat where esqarq = 1 order by stat.esqmed asc fetch first 1 rows only) as esq ON true `
                    +`where cap.meddia >= 5 AND cap.meddia <= 10), `
                    
                    +`anuncios_stats_alto as (select `
                    +`anu.codanu, SUM(CASE WHEN arq.ladanu = 'D' THEN 1 ELSE 0 END) as dirarq, SUM(CASE WHEN arq.ladanu = 'E' THEN 1 ELSE 0 END) as esqarq, `
                    +`SUM(COALESCE(dir.contagem, 0)) as cont_r, SUM(COALESCE(esq.contagem, 0)) as cont_l FROM web_anuncios anu `
                    +`inner join web_anuncio_arquivo arq On anu.codanu = arq.codanu `
                    +`left join lateral (select count(stat.codanu_r) as contagem from (select 1 as codigo) gen_ `
                    +`INNER JOIN web_view_livros stat ON gen_.codigo = 1 `
                    +`where stat.codanu_r = anu.codanu AND arq.ladanu = 'D' and DATE(stat.datvie) = CURRENT_DATE) as dir ON true `
                    +`left join lateral (select count(stat.codanu_l) as contagem from (select 1 as codigo) gen_ `
                    +`INNER JOIN web_view_livros stat ON gen_.codigo = 1 `
                    +`where stat.codanu_l = anu.codanu AND arq.ladanu = 'E' and DATE(stat.datvie) = CURRENT_DATE) as esq ON true `
                    +`WHERE  anu.prianu = 'A' AND anu.status = 'A' GROUP BY anu.codanu), `
                    
                    +`media_anuncios_alto as (select stat.*, `
                    +`(CASE WHEN stat.cont_r = 0 THEN 0 ELSE (((stat.cont_r)::float * 100)::float / tot.cont_r) END) dirmed, `
                    +`(CASE WHEN stat.cont_l = 0 THEN 0 ELSE (((stat.cont_l)::float * 100)::float / tot.cont_r) END) esqmed `
                    +`from anuncios_stats_alto stat `
                    +`left join lateral (select SUM(cont_r) as cont_r, SUM(cont_l) as cont_l FROM anuncios_stats_alto) as tot ON true), `
                    
                    +`anuncio_alto as (select dir.codanu as codanu_r, esq.codanu as codanu_l, 'A' as prianu from livro_stats cap `
                    +`left join lateral (select stat.codanu, stat.dirmed from media_anuncios_alto stat where dirarq = 1 order by stat.dirmed asc fetch first 1 rows only) as dir ON true `
                    +`left join lateral (select stat.codanu, stat.esqmed from media_anuncios_alto stat where esqarq = 1 order by stat.esqmed asc fetch first 1 rows only) as esq ON true `
                    +`where cap.meddia >= 10) `
                    
                    +`select * from anuncio_baixo `
                    +`union all `
                    +`select * from anuncio_medio `
                    +`union all `
                    +`select * from anuncio_alto `
                , [req.body.codliv, req.body.codcap]);

                if (Array.isArray(anuncios)) { 
                  
                    if (anuncios.length > 0) {

                        if (anuncios[0].codanu_r) {

                            let retorno = await this.list(await this.createConnection(), 
                
                            `select arq.* from web_anuncios anu `
                            +`inner join web_anuncio_arquivo arq ON arq.codanu = anu.codanu `
                            +`WHERE anu.codanu = $1 AND arq.ladanu = 'D'` , [anuncios[0].codanu_r]);
                            if (Array.isArray(retorno) && (retorno.length > 0)) { 
                             
                                anunciosD = retorno[0];
                            }
                        }
                        if (anuncios[0].codanu_l) {

                            let retorno = await this.list(await this.createConnection(), 
                
                            `select arq.* from web_anuncios anu `
                            +`inner join web_anuncio_arquivo arq ON arq.codanu = anu.codanu `
                            +`WHERE anu.codanu = $1 AND arq.ladanu = 'E'` , [anuncios[0].codanu_l]);
                            if (Array.isArray(retorno) && (retorno.length > 0)) { 
                             
                                anunciosE = retorno[0];
                            }
                        }
                    }
                }
                await this.insertUpdate(await this.createConnection(), 
                        `insert into web_view_livros (codusu, codliv, codcap, datvie, codanu_l, codanu_r) `
                        +`VALUES ($1, $2, $3, current_timestamp, $4, $5);`,
                        [req.body.codusu, req.body.codliv, req.body.codcap,
                         (anunciosE && anunciosE.codanu ? anunciosE.codanu : null), (anunciosD && anunciosD.codanu ? anunciosD.codanu : null)]);
            }
            let visualizar = (req.body.tippes === 1) || (req.body.tippes === 3) || 
                             (req.body.tippes === 4);
            const livrosAgrupados = _.groupBy(livros, 'liv_codliv');
            _.forOwn(livrosAgrupados, (valliv, keyliv) => {
                
                let livro = {codliv: valliv[0].liv_codliv, codusu: valliv[0].liv_codusu, habmon: valliv[0].liv_habmon, 
                             titulo: valliv[0].liv_titulo, datcri: valliv[0].liv_datcri, desliv: valliv[0].liv_desliv, 
                             visliv: valliv[0].liv_visliv, bas64s: valliv[0].liv_bas64s, tiparq: valliv[0].liv_tiparq,
                             nomaut: valliv[0].use_nomaut, valace: valliv[0].sta_valace, visualizar: visualizar, vingen: null, style: '',
                             isColapse: !visualizar, adifav: req.body.tippes === 3,
                             generosList: [],
                             capitulosList: []};
                generosAgrupados = _.groupBy(valliv, 'tag_codgen');
                _.forOwn(generosAgrupados, (valgen, keygen) => {

                    livro.generosList.push({codliv: valgen[0].tag_codliv, codgen: valgen[0].tag_codgen, 
                                            tagger: valgen[0].tag_tagger});
                });
                capitulosAgrupados = _.groupBy(valliv, 'cap_codcap');
                _.forOwn(capitulosAgrupados, (valcap, keycap) => {

                    let capitulo = {
                        codcap: valcap[0].cap_codcap, numcap: valcap[0].cap_numcap, ordcap: valcap[0].cap_ordcap, 
                        codliv: valcap[0].cap_codliv, descap: valcap[0].cap_descap, datatu: valcap[0].cap_datatu, 
                        viscap: valcap[0].cap_viscap, numvie: valcap[0].sta_numvie, 
                        isColapse: false, proximo: proximo, anterior: anterior, anunciosD: anunciosD, anunciosE: anunciosE,
                        arquivosList: []
                      };
                    if (!visualizar) {
                        arquivosAgrupados = _.groupBy(valcap, 'arq_ordarq');
                        _.forOwn(arquivosAgrupados, (valarq, indarq) => {

                            capitulo.arquivosList.push({codcap: valarq[0].arq_codcap, bas64s: valarq[0].arq_bas64s, 
                                                        ordarq: valarq[0].arq_ordarq, tiparq: valarq[0].arq_tiparq, 
                                                        nomarq: valarq[0].arq_nomarq});
                        });
                        capitulo.arquivosList = _.orderBy(capitulo.arquivosList, 'ordarq', 'asc');
                    }
                    livro.capitulosList.push(capitulo);
                });
                livro.capitulosList = _.orderBy(livro.capitulosList, 'ordcap', 'asc');
                retorno.push(livro);
            });

            if ((req.body.tippes === 5) && (retorno.length > 0)) {

                retorno = [retorno[0].capitulosList[0]];
            }
        } 
        return res.status(200).send({codigo: 200, mensagem: retorno});
    } else {

        return res.status(200).send({ codigo: 401, mensagem: 'Usuário diferente do logado!' })
    }
});

app.post('/salvar-favorito', async (req, res) => {


    if (await this.verificaConexaoUsuario(req)) {

        return res.status(200).send({codigo: 401, mensagem: 'Usuário logado em sessão diferente!'});
    }
    if (Number(req.body.codusu) === Number(req.headers['yr_cod'])) {

        let comando = '';
        let lista = [];
        if (!req.body.adifav) {

            comando = `DELETE FROM web_user_favoritos where codusu = $1 AND codliv = $2`;
            lista = [req.body.codusu, req.body.codliv];
        } else {

            comando = `INSERT INTO web_user_favoritos (codusu, codliv) VALUES ($1, $2);`;
            lista = [req.body.codusu, req.body.codliv];
        }
        const retorno = await this.insertUpdate(await this.createConnection(), 
        comando,
        lista);

        if (retorno && (retorno.rowCount > 0)) {

            return res.status(200).send({codigo: 200, mensagem: `Livro ${req.body.adifav ? 'favoritado' : 'desfavoritado'} com sucesso!`});
        } else {

            return res.status(500).send({ mensagem: `Erro ao ${req.body.adifav ? 'favoritar' : 'desfavoritar'} Livro!`});
        }
    } else {

        return res.status(200).send({ codigo: 401, mensagem: 'Usuário diferente do logado!' })
    }
});

app.listen(10001);

console.log('-----------------------------')
console.log('Iniciou TCC-Back')
console.log('-----------------------------')
