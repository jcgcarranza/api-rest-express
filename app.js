const inicioDebug = require('debug')('app:inicio');
const dbDebug = require('debug')('app:db');
const express = require('express'); // Importa express
const config = require('config');
const logger = require('./logger');
const morgan = require('morgan');
const Joi = require('joi'); // Importa Joi
const app = express(); // Crea una instancia de express

// Middleware
// El middleware es un bloque de código que se ejecuta
// entre las peticiones del usuario (cliente) y el
// request que llega al servidor. Es un enlace entre la petición
// del usuario y el servidor, antes de que éste pueda dar una respuesta.

// Las funciones de middleware son funciones que tienen acceso
// al objeto de petición (request, req), al objeto de respuesta (response, res)
// y a la siguiente función de middleware en el ciclo de peticiones/respuestas
// de la aplicación. La siguiente función de middleware se denota
// normalmente con una variable denominada next.

// Las funciones de middleware pueden realizar las siguientes tareas:
//      - Ejecutar cualquier código
//      - Realizar cambios en la petición y los objetos de respuesta
//      - Finalizar el ciclo de petición/respuesta
//      - Invocar la siguiente función de middleware en la pila

// Express es un framework de direccionamiento y de uso de middleware
// que permite que la aplicación tenga funcionalidad mínima propia.

// Ya usamos algunos middleware como express.json()
// transforma el body del req a formato JSON

//           -----------------------
// request -|-> json() --> route() -|-> response
//           -----------------------

// route() --> Funciones GET, POST, PUT, DELETE

// JSON hace un parsing de la entrada a formato JSON
// De tal forma que lo que recibamos en el req de una
// petición esté en formato JSON
app.use(express.json()); // Se le dice a express que use este middleware
app.use(express.urlencoded({extended:true}));
// public es el nombre de la carpeta que tendrá los recursos estáticos
app.use(express.static('public'));

console.log(`Aplicación: ${config.get('nombre')}`);
console.log(`DB server: ${config.get('configDB.host')}`);


// Uso de middleware de tercero - morgan
if(app.get('env') == 'development'){
    app.use(morgan('tiny'));
    inicioDebug('Morgan está habilitado...');
}

// Operaciones con la base de datos
dbDebug('Conectado a la base de datos...');

// app.use(logger); // logger ya hace referencia a la función log (exports)

// app.use(function(req, res, next){
//    console.log('Autenticando...');
//    next();
//});

// Query string
// url/?var1=valor1&var2=valor2&var3=valor3...

// Hay cuatros tipos de peticiones
// Asociadas con las operaciones CRUD de una base de datos
// app.get(); // Consulta de datos
// app.post(); // Envía datos al servidor (insertar datos)
// app.put(); // Actualiza datos
// app.delete(); // Elimina datos

const usuarios = [
    {id:1, nombre:'Juan'},
    {id:2, nombre:'Ana'},
    {id:3, nombre:'Karen'},
    {id:4, nombre:'Luis'}
];

// Consulta en la ruta raíz de nuestro servidor
// Con una función callback
app.get('/', (req, res) => {
    res.send('Hola mundo desde Express!');
});

app.get('/api/usuarios', (req, res) => {
    res.send(usuarios);
});

// Cómo pasar parámetros dentro de las rutas
// p. ej. solo quiero un usuario específico en vez de todos
// Con los : delante del id Express
// sabe que es un parámetro a recibir
// http://localhost:5000/api/usuarios/1990/2/sex='m'&name=''
app.get('/api/usuarios/:id', (req, res) => {
    // Devuelve el primer elemento del arreglo que cumpla con un predicado
    // parseInt hace el casteo a entero directamente
    let usuario = existeUsuario(req.params.id);
    if (!usuario)
        res.status(404).send('El usuario no se encuentra'); // Devuelve el estado HTTP
    res.send(usuario);
});


// Petición POST
// Tiene el mismo nombre que la petición GET
// Express hace la diferencia dependiendo del
// tipo de petición
app.post('/api/usuarios', (req, res) => {
    // El objeto req tiene la propiedad body
    const {value, error} = validarUsuario(req.body.nombre);
    if(!error){
        const usuario = {
            id:usuarios.length + 1,
            nombre:req.body.nombre
        };
        usuarios.push(usuario);
        res.send(usuario);
    }
    else{
        const mensaje = error.details[0].message;
        res.status(400).send(mensaje);
    }
});

// Petición PUT
// Método para actualizar información
// Recibe el id del usuario que se quiere modificar
// Utilizando un parámetro en la ruta :id
app.put('/api/usuarios/:id', (req, res) => {
    // Validar que el usuario se encuentre
    // en los registros
    let usuario = existeUsuario(req.params.id);
    if (!usuario){
        res.status(404).send('El usuario no se encuentra'); // Devuelve el estado HTTP
        return;
    }
    // En el body del request debe venir la información
    // para hacer la actualización
    // Validar que el nombre cumpla con las condiciones
    const {value, error} = validarUsuario(req.body.nombre);
    if(error){
        const mensaje = error.details[0].message;
        res.status(400).send(mensaje);
        return;
    }
    // Actualiza el nombre del usuario
    usuario.nombre = value.nombre;
    res.send(usuario);
});

// Petición DELETE
// Método para eliminar información
// Recibe el id del usuario que se quiere eliminar
// Utilizando un parámetro en la ruta :id
app.delete('/api/usuarios/:id', (req, res) => {
    const usuario = existeUsuario(req.params.id);
    if (!usuario){
        res.status(404).send('El usuario no se encuentra');
        return;
    }
    // Encontrar el índice del usuario dentro del arreglo
    // Devuelve el indice de la primera ocurrencia del elemento
    const index = usuarios.indexOf(usuario);
    usuarios.splice(index, 1); // Elimina el elemento en el índice indicado
    res.send(usuario); // Responde con el usuario eliminado
});

// Usando el módulo process, se lee una variable
// de entorno.
// Si la variable no existe, va a tomar un valor
// por default (3000)
const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Escuchando en el puerto ${port}...`);
});

function existeUsuario(id){
    return (usuarios.find(u => u.id === parseInt(id)));
}

function validarUsuario(nom){
    const schema = Joi.object({
        nombre:Joi.string().min(3).required()
    });
    return (schema.validate({nombre:nom}));
}