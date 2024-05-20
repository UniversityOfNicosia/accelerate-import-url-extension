// A cache to store URLs that have already been saved to prevent duplicate entries.
const cache = new Map();

// Rate limiting configuration: 1 minute window with a maximum of 10 requests.
const rateLimitWindowMs = 60 * 1000; // 1 minute in milliseconds
const maxRequestsPerWindow = 10; // Allow up to 10 requests per minute

// A map to track the number of requests made by each user within the rate limit window.
const requestCounts = new Map();


// Event listener for when the extension's action button is clicked.
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.message === 'login_success') {

    let url = "";
    // Query the active tab to get the URL
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        url = tabs[0].url;
        console.log('Active tab URL:', tabs[0].url);
      } else {
        console.log('No active tab found.');
      }
    });

    const { token, loginTimestamp } = await getTokenAndTimestamp();


    // Send a POST request to the SaaS system to save the URL.
    const response = await fetch('https://api.accelerate.unic.ac.cy/my-files/webscraping', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        Url: url,
        FetchImages: true
      })
    });


    // try {
    //   // Retrieve the stored token and login timestamp from local storage.


    //   // Check if the token is still valid.
    //   if (!isTokenValid(token, loginTimestamp)) {
    //     showNotification('Error', 'Your session has expired. Please log in again.');
    //     return;
    //   }

    //   // Ensure the active tab has a URL.
    //   if (!url) {
    //     showNotification('Error', 'No URL found in the active tab.');
    //     return;
    //   }

    //   // Decrypt the token to use it for authentication.
    //   const decryptedToken = await decryptToken(token);

    //   // Retrieve the user ID from the decrypted token.
    //   const userId = await getUserId(decryptedToken);

    //   // Check if the user is allowed to make a request based on rate limiting.
    //   if (!isRequestAllowed(userId)) {
    //     showNotification('Error', 'Rate limit exceeded. Please try again later.');
    //     return;
    //   }

    //   // Handle the URL saving process.
    //   await handleSaveUrl(decryptedToken, url);
    // } catch (error) {
    //   logError('Action Click Listener Error', error);
    // }
  }

});

// Function to handle the URL saving process.
async function handleSaveUrl(token, url) {
  try {
    showNotification('Loading', 'Saving URL...');
    await saveUrl(token, url);
    showNotification('Success', 'The URL has been saved successfully.');
  } catch (error) {
    showNotification('Error', `Failed to save URL: ${error.message}`);
    logError('Save URL Error', error);
  }
}

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

// Function to check if the token is still valid based on the login timestamp.
function isTokenValid(token, loginTimestamp) {
  const currentTime = Date.now();
  const tokenExpiryTime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  return token && (currentTime - loginTimestamp) <= tokenExpiryTime;
}

// Function to save the URL to the SaaS system.
async function saveUrl(token, url) {
  try {
    // Check if the URL is already saved in the cache.
    if (cache.has(url)) {
      throw new Error('This URL is already saved.');
    }

    // Send a POST request to the SaaS system to save the URL.
    const response = await fetch('https://api.accelerate.unic.ac.cy/my-files/webscraping', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        Url: url,
        FetchImages: true
      })
    });

    // Handle any errors that occur during the request.
    if (!response.ok) {
      const errorData = await response.json();
      handleSaveUrlError(response.status, errorData);
    }

    // Add the URL to the cache to prevent duplicate entries.
    cache.set(url, true);
  } catch (error) {
    logError('Save URL Function Error', error);
    throw error;
  }
}

// Function to handle errors that occur during the URL saving process.
function handleSaveUrlError(status, errorData) {
  if (status === 409) {
    throw new Error('This URL is already saved.');
  } else if (status === 400) {
    throw new Error('Bad request. Please check the URL and try again.');
  } else if (status === 500) {
    throw new Error('Server error. Please try again later.');
  } else {
    throw new Error(errorData.message || 'An unexpected error occurred. Please try again.');
  }
}

// Function to show a notification to the user.
function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title,
    message,
    priority: 2
  }, (notificationId) => {
    // Auto-close the notification after 5 seconds.
    setTimeout(() => {
      chrome.notifications.clear(notificationId);
    }, 5000);
  });
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

// Function to decrypt the token using the Web Crypto API.
async function decryptToken(encryptedToken) {
  const key = await getCryptoKey();
  const iv = new Uint8Array(encryptedToken.iv);
  const data = new Uint8Array(encryptedToken.data);
  const decryptedToken = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    data
  );
  return new TextDecoder().decode(decryptedToken);
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

// Function to check if the user is allowed to make a request based on rate limiting.
function isRequestAllowed(userId) {
  const currentTime = Date.now();
  const userRequests = requestCounts.get(userId) || [];

  // Filter out requests that are outside the rate limit window.
  const recentRequests = userRequests.filter(timestamp => currentTime - timestamp < rateLimitWindowMs);

  // Check if the number of recent requests exceeds the maximum allowed.
  if (recentRequests.length >= maxRequestsPerWindow) {
    return false;
  }

  // Add the current request timestamp to the list of recent requests.
  recentRequests.push(currentTime);
  requestCounts.set(userId, recentRequests);

  return true;
}

// Function to retrieve the user ID from the decrypted token.
async function getUserId(token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  return payload.sub; // Assuming 'sub' contains the user ID.
}