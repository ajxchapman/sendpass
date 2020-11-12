const QRCode = require('qrcode');
const QRScanner = require('qr-scanner').default;

const AES = require("crypto-js/aes");
const CryptoJS = require("crypto-js/core")
const { v4: uuidv4 } = require('uuid');

import './global.scss';

import QrScannerWorkerPath from '!!file-loader!../node_modules/qr-scanner/qr-scanner-worker.min.js';
QRScanner.WORKER_PATH = QrScannerWorkerPath;

const sps = 4;

const canvas = document.querySelector('canvas');
const video = document.querySelector('video');

function log() {
  const logdiv = document.getElementById('log');
  console.log(arguments);
  logdiv.innerHTML = logdiv.innerHTML + `<pre>${JSON.stringify(arguments)}</pre>`;
}

function escapeHTML(text) {
  return text.replace(/[&<"']/g, function(m) {
    switch (m) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '"':
        return '&quot;';
      default:
        return '&#039;';
    }
  });
}

function generateQR(recv_settings) {
  log("Recv settings", {recv_settings});
  QRCode.toCanvas(canvas, JSON.stringify(recv_settings));
}

function scanQR(engine, callback) {
  var count = 0;
  // Scan for QR codes
  (function _scanQR() {
      QRScanner.scanImage(video, null, engine).then(result => {
        log("scanQR", {result});
        // Stop and kill the video stream
        video.srcObject.getTracks().forEach(function(track) { track.stop(); });
        video.remove();

        callback(JSON.parse(result));
      }).catch((err) => {
        if (err == 'No QR code found') {
          count += 1;
          if (count < sps * 10) {
            setTimeout(_scanQR, 1000 / sps);
          }
          else {
            // Stop and kill the video stream
            video.srcObject.getTracks().forEach(function(track) { track.stop(); });
            video.remove();
          }
        } else {
          log(`Fatal error: ${err}`);
        }
      });
  })();
}

function wsSend(data) {
  var sendSocket = new WebSocket(`wss://${location.host}/send/${data.uuid}`);
  sendSocket.onopen = () => {
    log("wsSend", {data});
    sendSocket.send(JSON.stringify(data));
  };
}

function wsRecv(recv_settings, callback) {
  var recvSocket = new WebSocket(`wss://${location.host}/recv/${recv_settings.uuid}`);
  recvSocket.onmessage = event => {
    let data = JSON.parse(event.data);
    log("wsRecv", {data});

    // Decrypt payload
    data.payload = JSON.parse(AES.decrypt(data.payload, recv_settings.key, { iv : recv_settings.iv }).toString(CryptoJS.enc.Utf8));
    callback(data);
  };
}

function recvMessage() {
  const recv_settings = {
    url : location.href,
    uuid : uuidv4(),
    key : CryptoJS.lib.WordArray.random(128 / 8).toString(),
    iv: CryptoJS.lib.WordArray.random(128 / 8).toString()
  };

  canvas.style.display = 'block';
  video.style.display = 'none';

  generateQR(recv_settings);
  
  wsRecv(recv_settings, (data) => {
    video.style.display = 'none';
    canvas.style.display = 'none';

    let msg = escapeHTML(data.payload.msg);
    document.getElementById('payload').innerHTML = `<h2>Received payload:</h2><pre>${msg}</pre>`;
  });
}

function sendMessage(payload) {
  canvas.style.display = 'none';
  video.style.display = 'block';

  // Camera stuff
  if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
    navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment'
      }
    }).then((stream) => {
      video.srcObject = stream;
      video.addEventListener('play', function() {
        QRScanner.createQrEngine(QRScanner.WORKER_PATH).then(engine => {
          scanQR(engine, (result) => {
            video.style.display = 'none';
            canvas.style.display = 'none';

            let msg = escapeHTML(payload.msg);
            document.getElementById('payload').innerHTML = `<h2>Sent payload:</h2><pre>${msg}</pre>`;

            wsSend({
              uuid : result.uuid, 
              url : result.url, 
              // Encrypt payload
              payload: AES.encrypt(JSON.stringify(payload), result.key, { iv: result.iv }).toString()
            });
          });
        });
      });
    });
  }
}

document.getElementById('sendClipboard').onclick = () => {
  navigator.clipboard.readText().then(text => {
    sendMessage({
      msg : text
    });
  });
}

document.getElementById('sendText').onclick = () => {
  sendMessage({
    msg : document.querySelector('textarea').value || 'Hello World!'
  });
}

recvMessage();