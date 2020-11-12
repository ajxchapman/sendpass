const express = require('express');
const fs = require('fs');
const https = require('https');
const path = require('path');
const WebSocket = require('ws');
const morgan = require('morgan');

const app = express();

app.use(morgan('combined'));

var certificate = fs.readFileSync(path.join(__dirname + '../../../server_cert.pem'));
var privateKey  = fs.readFileSync(path.join(__dirname + '../../../server_key.pem'));

const clients = {};

const wss = new WebSocket.Server({ noServer: true });
wss.on('connection', (ws, req) => {
    const uuid = req.url.split('/').pop();

    if (req.url.startsWith('/recv/')) {
        if (uuid in clients) {
            console.log(`Error: duplicate uuid ${uuid}`);
            ws.terminate();
        }
        else {
            clients[uuid] = ws;
            ws.on('close', () => {
                console.log(`Closing recv connection ${uuid}`);
                delete clients[uuid];
            });
        }
    }
    else {
        ws.on('message', message => {
            if (uuid in clients) {
                console.log(message);
                var client = clients[uuid];
                if (client.readyState === WebSocket.OPEN) {
                    client.send(message);
                }
                client.terminate();
            }
            else {
                console.log(`Error: No recving uuid ${uuid}`);
            }
            ws.terminate();
        });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../dist/index.html'));
})

app.use(express.static(path.join(__dirname, '../../dist/')))
app.use(express.static(path.join(__dirname, '../../assets/')))

const httpsServer = https.createServer({cert: certificate, key: privateKey}, app);
const server = httpsServer.listen(3000);


server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, socket => {
        wss.emit('connection', socket, request);
    });
});