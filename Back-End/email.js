const nodemailer = require("nodemailer");

exports.iniciaEnvioEmail = async (mensagem) => {

    try {

        const transport = await nodemailer.createTransport({
            pool: true,
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
              user: 'jeancrlbarbosa@gmail.com',
              pass: 'aqrkoujpzwxwfwpk',
            },
          });
        return await this.enviarEmail(transport, mensagem);
    } catch (err) {

        return err;
    }
}

  
exports.enviarEmail = (transport, mensag) => {

    const retorno = new Promise((resolve, reject) => {

        try {

            transport.verify((error, success) => {

                if (error) {

                    resolve(error);
                }
                return transport.sendMail(mensag, (err, info) => {

                    if (err) {

                        resolve(err);
                    }

                    resolve(info);
                });
            });
        } catch (err) {

            resolve(err);
        }
    });

    Promise.all([retorno]).then(retorno => retorno[0]);
}