// DOM elements
let queryText = document.querySelector('#queryText');
let queryButton = document.querySelector('#queryButton');


let websocket = new WebSocket(window.location.href);


websocket.addEventListener('open', () => {
  console.log('Connected to WebSocket on', websocket.url);
});
websocket.addEventListener('message', (event) => {
  try {
    let message = JSON.parse(event.data);
    responseText.textContent += message.data;
  }
  catch(err) {}
});
websocket.addEventListener('error', (event) => {
  console.log('WebSocket error');
});
websocket.addEventListener('close', (event) => {
  console.log('Disconnected from WebSocket on', websocket.url);
});

// Handle Query button click
queryButton.addEventListener('click', () => {
  let message = { type: "query", data: queryText.value };
  responseText.textContent = '';
  websocket.send(JSON.stringify(message));
});