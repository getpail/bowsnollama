let conversation = document.querySelector('#conversation');
let connectIcon = document.querySelector('#connectIcon');
let websocket = new WebSocket(window.location.href);

let currentResponseBlock = null;
let markdownBuffer = '';

websocket.addEventListener('open', () => {
  connectIcon.setAttribute('class', 'bi-cloud-fill text-success');
});
websocket.addEventListener('message', (event) => {
  connectIcon.setAttribute('class', 'bi-cloud-arrow-up text-success');
  try {
    let message = JSON.parse(event.data);
    if(message.type === 'response') handleResponse(message.data);
  } catch(err) {}
});
websocket.addEventListener('error', () => {
  connectIcon.setAttribute('class', 'bi-cloud-fill text-warning');
});
websocket.addEventListener('close', () => {
  connectIcon.setAttribute('class', 'bi-cloud-fill text-danger');
});

/*
function normalizeMarkdown(markdown) {
  return markdown
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join(' ')
    .replace(/ +/g, ' ')
    .replace(/([.!?])\s(?=[A-Z])/g, '$1\n\n'); // heuristic: turn end of sentences back to paragraphs
}
*/
function normalizeMarkdown(markdown) {
  return markdown;
}


// Handle a response message
function handleResponse(data) {
  if(data.message?.content) {
    markdownBuffer += data.message.content;

    const normalized = normalizeMarkdown(markdownBuffer);
    const rendered = marked.parse(normalized);
    let container = currentResponseBlock.querySelector('.llm-response');
    container.innerHTML = rendered;
    conversation.scrollTop = conversation.scrollHeight;
  }

  if(data.done) {
    connectIcon.setAttribute('class', 'bi-cloud-fill text-success');
    markdownBuffer = '';
    addNewInputBox();
  }
}

function submitQueryFrom(textarea, button) {
  const input = textarea.value.trim();
  if(!input) return;

  // Remove input box
  textarea.closest('.input-group').remove();

  // Add user message to chat
  const userBlock = document.createElement('div');
  userBlock.className = 'mb-3';
  userBlock.innerHTML = `<div class="fw-bold text-primary">You</div><div>${marked.parseInline(input)}</div>`;
  conversation.appendChild(userBlock);

  // Add assistant response container
  currentResponseBlock = document.createElement('div');
  currentResponseBlock.className = 'mb-5';
  currentResponseBlock.innerHTML = `<div class="fw-bold text-success">Assistant</div><div class="llm-response"></div>`;
  conversation.appendChild(currentResponseBlock);

  // Send message to server
  let message = { type: "query", data: input };
  websocket.send(JSON.stringify(message));

  conversation.scrollTop = conversation.scrollHeight;
}

// Add a new input area at the end
function addNewInputBox() {
  const inputGroup = document.createElement('div');
  inputGroup.className = 'input-group mt-5';
  inputGroup.innerHTML = `
    <textarea class="form-control" aria-label="Query" id="queryText" rows="1"></textarea>
    <button class="btn btn-secondary" type="button" id="queryButton"><i class="bi-question-lg"></i></button>
  `;
  conversation.appendChild(inputGroup);

  const textarea = inputGroup.querySelector('#queryText');
  const button = inputGroup.querySelector('#queryButton');

  button.addEventListener('click', () => submitQueryFrom(textarea, button));
  textarea.addEventListener('keydown', (event) => {
    if(event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submitQueryFrom(textarea, button);
    }
  });

  textarea.focus();
}

// Kick off the first input field
addNewInputBox();
