const express = require('express');
const fs = require('fs');
const morgan = require('morgan');
const app = express();
const cors = require('cors');

app.listen(3300);
app.use(morgan('combined'));
app.use(cors());

app.get('/', (req, res) => {
    fs.readFile('./Noticia.txt','utf8', (err, data) => {
        res.send(data);
    });
});

