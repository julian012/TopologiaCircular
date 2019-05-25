const express = require('express');
const morgan = require('morgan');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser')
const axios = require('axios');
var isLeader = false;
let iscordinator = false;
var url = 'http://localhost:3302/status';
var urlChoice = 'http://localhost:3302/choice';
var urlCheck = 'http://localhost:3302/checkLeader';

var id = 3;
var idLeader = 8;
app.set('view engine', 'ejs');
app.set('views', './');
app.listen(3301);
app.use(morgan('combined'));
app.use(cors());
app.use(bodyParser.json());

app.post('/status', (req, res) => {
    var {test, status}  = req.body;
    console.log(req.body);
    console.log("Lider que tengo actualmente como servidor " + id + " es: " + idLeader);
    res.json({ 
        test : id, 
        status : isLeader
    });
    
    if(id != idLeader){ //Cuando no es lider
        setTimeout(excecute, 2000, test,status);
    }else if((id == idLeader) && isLeader){ //Cuando es lider pero no ha cambiado su etado
        setTimeout(excecute, 2000, test,status);
    }else{ //Cuando es lider y cambio su estado
        console.log("El lider cambio su estado no va aseguir evaluando el status");
    }
})

function excecute(info, stat){
    axios.post(url, { 
        test: info, 
        status : stat
    })
    .then((response) => {
        var {test, status} = response.data;
        if((idLeader == test) && !status){
            console.log("El lider se retiro");
            iscordinator = true;
            console.log("Ahora el " + id + " es cordinador");
            selectLeader(id,idLeader, id);
        }else{
            console.log("El lider no ha cambiado su estado")
        }
    })
    .catch((error) => {
        console.log(error);
    });
}

function selectLeader(idCordinator, idLastLeader, idNewLeader){
    //Empieza con la petición mandando el IdCordinador, el Id del ultimo lider y el id del nuevo lider
    axios.post(urlChoice, { 
        idCordinator: idCordinator,
        idLastLeader: idLastLeader,
        idNewLeader: idNewLeader
    }).then((response) => {
        //Llega la respuesta
        let {message} = response.data;
        console.log(message);
    })
    .catch((error) => {
        console.log(error);
    }); 
}
//Llega la petición al servidor
app.post('/choice', (req, res) => {
    console.log("Id :" + id + " IdLeader: " + idLeader)
    var {idCordinator, idLastLeader, idNewLeader} = req.body;
    console.log(req.body);
    if(id == idLastLeader){//Evaluar si llega la peticion al lider que renuncio para evitar que participe en la eleccion
      idLeader = idNewLeader; //Se le asigna el nuevo lider al lider anterior
      isLeader = false;
      selectLeader(idCordinator, idLastLeader, idNewLeader); //Sigue mandando la peticion  
    }else if(!iscordinator){//Si no es cordinador
        iscordinator = false;
        if(id > idNewLeader ){//Si el id es mayor al nuevo id
            idLeader = id; //Queda como lider por tener el idMayor
            isLeader = true; //Queda asignado como lider;
            selectLeader(idCordinator, idLastLeader, idLeader); //Sigue mandando la peticion  
        }else{
            isLeader = false;
            idLeader = idNewLeader; //Se le asigna el nuevo lider
            selectLeader(idCordinator, idLastLeader, idNewLeader);//Sigue mandando la petición
        }
    }else if(iscordinator && (id == idCordinator)){ //Si llega a donde el cordinador otra vez la peticion y con el nuevo lider
        iscordinator = false;
        if(id == idNewLeader){ //Si llega que el coordinador queda como lider
            idLeader = id;
            isLeader = true; //Queda asignado como lider y puede empezar a ejecutar otra vez el status
            setTimeout(excecute, 2000, id,isLeader);
        }else{ //Si queda otro como lider
            idLeader = idNewLeader;
            isLeader = false;
            //Tiene que empezar a validar en los demas si quedo correcto el lider
            checkLeader(idLeader);
        }
    }
    res.json({
        message : "Datos cambiados"
    });
});

function checkLeader(idLeader){
    axios.post(urlCheck, { 
        idLeader: idLeader
    }).then((response) => {
        //Llega la respuesta
        let {message} = response.data; 
        console.log(message);
    })
    .catch((error) => {
        console.log(error);
    }); 
}

app.post('/checkLeader', (req, res) => {
    if( id != req.body.idLeader){ //Se evalua si llego id diferente a el lider que el tiene
        idLeader = req.body.idLeader;
        isLeader = false;
        checkLeader(req.body.idLeader);
    }else{ //Si es el lider
        isLeader = true;
        idLeader = id;
        setTimeout(excecute, 2000, id,isLeader);
    }
    res.json({
        message : "Lider Cambiado correctamente"
    });
})


app.get('/giveup', (req, res) => {
    if(isLeader){
        isLeader = false;
        res.send("Estado cambiado del lider correctamente");
    }else{
        console.log("No es lider no puede cambiar su estado")
        res.send("No es lider no puede cambiar su estado");
    }    
})

app.get('/', function(req, res) {
    res.render('index', { title: 'Express' });
})