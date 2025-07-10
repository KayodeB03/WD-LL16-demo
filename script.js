// Get chatbot elements
const chatbotToggleBtn = document.getElementById('chatbotToggleBtn');
const chatbotPanel = document.getElementById('chatbotPanel');

if (chatbotToggleBtn && chatbotPanel) {
  // Toggle chat open/closed when clicking the button
  chatbotToggleBtn.addEventListener('click', () => {
    chatbotPanel.classList.toggle('open');
  });

  // Close chat when clicking anywhere except the chat panel or button
  document.addEventListener('click', (e) => {
    // If chat is open AND user clicked outside chat area, close it
    if (chatbotPanel.classList.contains('open') && 
        !chatbotPanel.contains(e.target) && 
        !chatbotToggleBtn.contains(e.target)) {
      chatbotPanel.classList.remove('open');
    }
  });
}

// Get chat elements
const chatbotSendBtn = document.getElementById('chatbotSendBtn');
const chatbotInput = document.getElementById('chatbotInput');
const chatbotMessages = document.getElementById('chatbotMessages');

// Store the conversation history
let messages = [
  { role: 'system', content: 'You are a helpful assistant.' }
];

// Function to add a message to the chat window
function addMessage(text, sender) {
  // Create a new div for the message
  const messageDiv = document.createElement('div');
  // Add a class for styling (user or assistant)
  messageDiv.className = sender === 'user' ? 'chatbot-message user' : 'chatbot-message assistant';
  // Format assistant's reply with line breaks for sections (script, tone, CTA, etc.)
  if (sender === 'assistant') {
    // Replace double line breaks or section headers with <br><br> for spacing
    messageDiv.innerHTML = text
      .replace(/\n\s*\n/g, '<br><br>') // double line breaks
      .replace(/(Script:|Tone:|CTA:|Music:|Visual Direction:|Voiceover:|Questions?:)/gi, '<b>$1</b>');
  } else {
    // For user, just escape and show as text
    messageDiv.textContent = text;
  }
  // Add the message to the chat window
  chatbotMessages.appendChild(messageDiv);
  // Scroll to the bottom
  chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

// Function to send a message to OpenAI API
async function sendMessageToOpenAI(userInput) {
  // Add user's message to chat
  addMessage(userInput, 'user');

  // Add user's message to the messages array
  messages.push({ role: 'user', content: userInput });

  // Show a loading message while waiting for response
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'chatbot-message assistant';
  loadingDiv.textContent = 'Thinking...';
  chatbotMessages.appendChild(loadingDiv);
  chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

  try {
    // Call OpenAI API using fetch and async/await
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}` // apiKey is from secrets.js
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Use the gpt-4o model
        messages: messages, // Send the full conversation history
        temperature: 0.8, // Make the assistant more creative
        max_tokens: 300 // Keep responses short and focused
      })
    });

    // Parse the JSON response
    const data = await response.json();
    // Remove the loading message
    chatbotMessages.removeChild(loadingDiv);
    // Get the assistant's reply
    const reply = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content
      ? data.choices[0].message.content.trim()
      : 'Sorry, I could not understand that.';
    // Add assistant's reply to chat
    addMessage(reply, 'assistant');
    // Add assistant's reply to the messages array
    messages.push({ role: 'assistant', content: reply });
  } catch (error) {
    // Remove the loading message
    chatbotMessages.removeChild(loadingDiv);
    // Show error message
    addMessage('Oops! Something went wrong.', 'assistant');
    console.error(error);
  }
}

// Listen for send button click
if (chatbotSendBtn && chatbotInput) {
  chatbotSendBtn.addEventListener('click', () => {
    const userInput = chatbotInput.value.trim();
    if (userInput) {
      sendMessageToOpenAI(userInput);
      chatbotInput.value = '';
    }
  });
  // Also send message on Enter key
  chatbotInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      chatbotSendBtn.click();
    }
  });
}
