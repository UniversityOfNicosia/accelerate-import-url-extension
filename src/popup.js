// Function to retrieve the stored token and login timestamp from local storage.
async function getTokenAndTimestamp() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['token', 'loginTimestamp'], (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result);
      }
    });
  });
}

async function isLoggedIn() {
  const { token, loginTimestamp } = await getTokenAndTimestamp();

  console.log(token)
  if (!isTokenValid(token, loginTimestamp)) {
    return false;
  }

  return true;

}

// Event listener to focus the email input field when the DOM content is loaded.
document.addEventListener('DOMContentLoaded', async () => {
  if (await isLoggedIn()) { // Assuming you have a function to check if the user is logged in
    chrome.runtime.sendMessage({ message: 'login_success' });
    showLoggedInView(); // Assuming you have a function to show the logged-in view
  } else {
    document.getElementById('email').focus();
  }
});



// Function to check if the token is still valid based on the login timestamp.
function isTokenValid(token, loginTimestamp) {
  const currentTime = Date.now();
  const tokenExpiryTime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  return token && (currentTime - loginTimestamp) <= tokenExpiryTime;
}

// Debounce timer to prevent multiple form submissions in quick succession.
let debounceTimer;

// Event listener for form submission.
document.getElementById('loginForm').addEventListener('submit', (event) => {
  event.preventDefault();

  // Clear any existing debounce timer.
  clearTimeout(debounceTimer);

  // Set a new debounce timer to handle form submission after a delay of 300ms.
  debounceTimer = setTimeout(handleLoginFormSubmit, 300);
});

// Event listeners to clear messages when the user starts typing in the input fields.
document.getElementById('email').addEventListener('input', clearMessages);
document.getElementById('password').addEventListener('input', clearMessages);

// Function to handle the login form submission.
async function handleLoginFormSubmit() {
  // Sanitize and trim the input values.
  const email = sanitizeInput(document.getElementById('email').value.trim());
  const password = sanitizeInput(document.getElementById('password').value.trim());

  // Get references to the message divs.
  const errorDiv = document.getElementById('error');
  const loadingDiv = document.getElementById('loading');
  const successDiv = document.getElementById('success');

  // Clear any existing messages.
  clearMessages();

  // Check if both email and password are provided.
  if (!email || !password) {
    showError('Please enter both email and password.');
    return;
  }

  // Show the loading indicator.
  showLoading(true);

  try {
    // Attempt to log in with the provided email and password.
    await login(email, password);

    // Reset the form and show a success message.
    document.getElementById('loginForm').reset();

    // Show the logged-in view
    showLoggedInView();
    showSuccess('Login successful!');

    // Close the popup after a short delay.
    setTimeout(() => {
      window.close();
    }, 2000);
  } catch (error) {
    // Show an error message if the login fails.
    showError(error.message);
    logError('Login Error', error);
  } finally {
    // Hide the loading indicator.
    showLoading(false);
  }
}

// Function to log in with the provided email and password.
async function login(email, password) {
  try {
    // Send a POST request to the login endpoint.
    const response = await fetch('https://api.accelerate.unic.ac.cy/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    // Handle any errors that occur during the request.
    if (!response.ok) {
      const errorData = await response.json();
      handleLoginError(response.status, errorData);
    }

    // Parse the response data to get the token.
    const data = await response.json();
    const token = data.accessToken;
    const loginTimestamp = Date.now();

    // Encrypt the token before storing it.
    // const encryptedToken = await encryptToken(token);
    await chrome.storage.local.set({ token: token, loginTimestamp });
    console.log('Token stored');
  } catch (error) {
    logError('Login Function Error', error);
    throw error;
  }
}

// Function to handle errors that occur during the login process.
function handleLoginError(status, errorData) {
  if (status === 401) {
    throw new Error('Invalid email or password. Please try again.');
  } else if (status === 400) {
    throw new Error('Bad request. Please check your input and try again.');
  } else if (status === 500) {
    throw new Error('Server error. Please try again later.');
  } else {
    throw new Error(errorData.message || 'An unexpected error occurred. Please try again.');
  }
}

// Function to sanitize user input to prevent XSS attacks.
function sanitizeInput(input) {
  const element = document.createElement('div');
  element.innerText = input;
  return element.innerHTML;
}

// Function to clear any existing error or success messages.
function clearMessages() {
  document.getElementById('error').textContent = '';
  document.getElementById('success').textContent = '';
}

// Function to show an error message.
function showError(message) {
  const errorDiv = document.getElementById('error');
  errorDiv.textContent = message;
  errorDiv.focus();
}

// Function to show a success message.
function showSuccess(message) {
  const successDiv = document.getElementById('success');
  successDiv.textContent = message;
  successDiv.focus();
}

// Function to show or hide the loading indicator.
function showLoading(isLoading) {
  const loadingDiv = document.getElementById('loading');
  loadingDiv.style.display = isLoading ? 'block' : 'none';
}

// Function to log errors for debugging purposes.
function logError(context, error) {
  console.error(`[${context}]`, error);
  // Optionally, send the error to a remote logging service.
  // fetch('https://your-logging-service.com/log', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify({ context, error: error.message, stack: error.stack })
  // });
}

// Function to encrypt the token using the Web Crypto API.
async function encryptToken(token) {
  const key = await getCryptoKey();
  const encodedToken = new TextEncoder().encode(token);
  const iv = crypto.getRandomValues(new Uint8Array(12)); // Initialization vector
  const encryptedToken = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    encodedToken
  );
  return { iv: Array.from(iv), data: Array.from(new Uint8Array(encryptedToken)) };
}

// Function to generate a cryptographic key using the Web Crypto API.
async function getCryptoKey() {
  const password = 'your-secure-password'; // Use a secure method to generate/store this password.
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Function to show the logged-in view and hide the login form
function showLoggedInView() {
  document.getElementById('loginFormWrapper').style.display = 'none';
  document.getElementById('loggedInWrapper').style.display = 'block';
}