let express = require('express');
let crypto = require("crypto");
let app  = express();
const { Pool } = require('pg');
const path = __dirname;
const bodyParser = require('body-parser');
const _ = require('lodash');
let static_path = `${__dirname}\\dist\\youread`;

app.use(express.static(static_path));

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

app.get('/', (req, res) => {
    return res.status(200).sendFile(`${path}\\dist\\youread\\index.html`);
});

app.listen(10000);
