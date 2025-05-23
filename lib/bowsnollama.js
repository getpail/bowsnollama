const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const express = require('express');
const WebSocket = require('ws');
const { Ollama } = require('ollama');


const PORT = 3000;
const SSL_PATH = 'config';
const OLLAMA_MODEL = 'gemma3:27b'; // gemma3:latest, gemma3:27b

/**
 * BoWsNoLlama Class
 * Bootstrap, WebSocket, Node.js and Ollama, in that order.
 */
class BoWsNoLlama {

  /**
   * BoWsNoLlama constructor
   * @param {Object} options The options as a JSON object.
   * @constructor
   */
  constructor(options) {
    let self = this;
    options = options || {};

    this.app = express();
    this.server = createServer(self.app, options);
    this.router = express.Router();
    this.ollama = new Ollama({ host: 'http://127.0.0.1:11434' });
    this.wss = new WebSocket.WebSocketServer({ server: self.server });
    this.wss.on('connection', (ws) => {
      console.log('WebSocket connection');
      ws.chatHistory = [];
      ws.on('message', (data) => { handleQuery(data, ws, self); });
    });

    initialiseExpressMiddleware(self.app, self.router, self, options);
    initialiseServer(self.server, options);
  }

}


/**
 * Create the http(s) server.
 * @param {Express} app The Express instance.
 * @param {Object} options The configuration options.
 */
function createServer(app, options) {
  let server;

  try {
    let credentials = {
        cert: fs.readFileSync(path.resolve(SSL_PATH  + '/certificate.pem')),
        key: fs.readFileSync(path.resolve(SSL_PATH + '/key.pem'))
    };
    server = https.createServer(credentials, app);
  }
  catch(err) {
    console.log('BoWsNoLlama is using HTTP, browse to http://...');
    return http.createServer(app);
  }

  console.log('BoWsNoLlama is using HTTPS, browse to https://...');
  return server;
}


/**
 * Initialise the middleware for the given Express instance.
 * @param {Express} app The Express instance.
 * @param {Router} router The Express router.
 * @param {BoWsNoLlama} instance The BoWsNoLlama instance.
 * @param {Object} options The configuration options.
 */
function initialiseExpressMiddleware(app, router, instance, options) {
  app.use(express.json());
  app.use('/', express.static(path.resolve(__dirname + '/../web')));
  app.use('/', router);
}


/**
 * Initialise the HTTP server by listening and handling errors.
 * @param {Server} server The server instance.
 * @param {Object} options The configuration options.
 */
function initialiseServer(server, options) {
  server.on('error', (error) => {
    if(error.code === 'EADDRINUSE') {
      console.log('Port', PORT, 'is already in use.',
                  'Is another BoWsNoLlama instance running?');
    }
  });

  server.listen(PORT, () => {
    console.log('BoWsNoLlama running on port', PORT);
  });
}


/**
 * Handle a LLM query.
 * @param {Object} data The WebSocket message data.
 * @param {WebSocket} ws The WebSocket connection instance.
 * @param {BoWsNoLlama} instance The BoWsNoLlama instance.
 */
async function handleQuery(data, ws, instance) {
  let message = JSON.parse(data);
  let ask = { role: "user", content: message.data };

  // Initialise chat history if not already present
  if (!ws.chatHistory) {
    ws.chatHistory = [];
  }

  // Append the user message to chat history
  ws.chatHistory.push(ask);

  instance.ollama.abort(); // Abort any previous call if needed

  const response = await instance.ollama.chat({
    model: OLLAMA_MODEL,
    messages: ws.chatHistory,
    stream: true
  });

  for await (const part of response) {
    if (part.message) {
      // Append assistant message to history
      ws.chatHistory.push({ role: "assistant", content: part.message.content });
    }

    let responseData = {
      message: part.message,
      model: part.model,
      done: part.done
    };

    ws.send(JSON.stringify({ type: "response", data: responseData }));
  }
}


module.exports = BoWsNoLlama;