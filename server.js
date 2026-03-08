var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http, { 
    maxHttpBufferSize: 1e8 // 100MB para aguentar áudios e vídeos
});
var path = require('path');
var fs = require('fs');

var diretorio = __dirname;
app.use(express.static(diretorio));

var ARQUIVO_BANCO = path.join(diretorio, 'banco_tropa.json');
var mensagensSalvas = [];
if (fs.existsSync(ARQUIVO_BANCO)) {
    mensagensSalvas = JSON.parse(fs.readFileSync(ARQUIVO_BANCO, 'utf8'));
}

var usuariosOnline = {};

app.get('/', function(req, res){
    res.sendFile(path.join(diretorio, 'dessocupados.html'));
});

io.on('connection', function(socket){
    // Envia o histórico assim que alguém conecta
    socket.emit('historico', mensagensSalvas);

    socket.on('registrar-nome', function(nome){
        socket.username = nome;
        usuariosOnline[socket.id] = nome;
        io.emit('lista-online', Object.values(usuariosOnline));
    });

    socket.on('chat message', function(data){
        mensagensSalvas.push(data);
        if(mensagensSalvas.length > 100) mensagensSalvas.shift();
        fs.writeFileSync(ARQUIVO_BANCO, JSON.stringify(mensagensSalvas));
        io.emit('chat message', data);
    });

    socket.on('disconnect', function(){
        if(socket.username){
            delete usuariosOnline[socket.id];
            io.emit('lista-online', Object.values(usuariosOnline));
        }
    });
});

http.listen(3000, "0.0.0.0", function(){
    console.log('---------------------------------------');
    console.log('🚀 desoCUpados V6 - TUDO SINCRONIZADO!');
    console.log('Acesse: http://localhost:3000');
    console.log('---------------------------------------');
});