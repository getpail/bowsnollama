// DOM elements
let queryText = document.querySelector('#queryText');
let queryButton = document.querySelector('#queryButton');


let websocket = new WebSocket(window.location.href);


websocket.addEventListener('open', () => {
  connectIcon.setAttribute('class', 'bi-cloud-fill text-success');
  console.log('Connected to WebSocket on', websocket.url);
});
websocket.addEventListener('message', (event) => {
  connectIcon.setAttribute('class', 'bi-cloud-arrow-up text-success');
  try {
    let message = JSON.parse(event.data);
    if(message.type === 'response') {  handleResponse(message.data); }
  }
  catch(err) {}
});
websocket.addEventListener('error', (event) => {
  connectIcon.setAttribute('class', 'bi-cloud-fill text-warning');
  console.log('WebSocket error');
});
websocket.addEventListener('close', (event) => {
  connectIcon.setAttribute('class', 'bi-cloud-fill text-danger');
  console.log('Disconnected from WebSocket on', websocket.url);
});

// Handle Query button click
queryButton.addEventListener('click', () => {
  let message = { type: "query", data: queryText.value };
  responseText.textContent = '';
  websocket.send(JSON.stringify(message));
});

// Handle a response message
handleResponse(data) {
  if(typeof data.message?.content === 'string') {
    responseText.textContent += data.message.content;
  }
  if(data.done) {
    connectIcon.setAttribute('class', 'bi-cloud-fill text-success');
  }
}