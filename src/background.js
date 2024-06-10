// import CryptoJS from "crypto-js";
// import { showNotification } from "./utils.js";

const LOGIN_URL = "https://stg-api.accelerate.unic.ac.cy/auth/login";
const WEBSCRAPING_URL =
  "https://stg-api.accelerate.unic.ac.cy/my-files/webscraping";

// Use environment variables or another secure method to manage your secret key
// const SECRET_KEY = process.env.SECRET_KEY || "your_secure_secret_key";

// function encryptToken(token) {
//   const iv = CryptoJS.lib.WordArray.random(16);
//   const encrypted = CryptoJS.AES.encrypt(
//     token,
//     CryptoJS.enc.Utf8.parse(SECRET_KEY),
//     {
//       iv: iv,
//       padding: CryptoJS.pad.Pkcs7,
//       mode: CryptoJS.mode.CBC,
//     }
//   );
//   return iv.toString() + encrypted.toString();
// }

// function decryptToken(token) {
//   const iv = CryptoJS.enc.Hex.parse(token.substr(0, 32));
//   const encrypted = token.substr(32);
//   const decrypted = CryptoJS.AES.decrypt(
//     encrypted,
//     CryptoJS.enc.Utf8.parse(SECRET_KEY),
//     {
//       iv: iv,
//       padding: CryptoJS.pad.Pkcs7,
//       mode: CryptoJS.mode.CBC,
//     }
//   );
//   return decrypted.toString(CryptoJS.enc.Utf8);
// }

async function getToken() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(["token"], (result) => {
      if (chrome.runtime.lastError) {
        reject(
          new Error(`Error getting token: ${chrome.runtime.lastError.message}`)
        );
      } else {
        const token = result.token ? result.token : null;
        resolve(token);
      }
    });
  });
}

async function setToken(token) {
  const encryptedToken = token;
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ token: encryptedToken }, () => {
      if (chrome.runtime.lastError) {
        reject(
          new Error(`Error setting token: ${chrome.runtime.lastError.message}`)
        );
      } else {
        resolve();
      }
    });
  });
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return Date.now() >= payload.exp * 1000;
  } catch (e) {
    return true;
  }
}

async function handleFetchResponse(response) {
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Session expired. Please log in again.");
    }
    throw new Error("Network error occurred. Please try again.");
  }
  return await response.json();
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    if (request.action === "login") {
      handleLogin(request.credentials, sendResponse)
        .then(() => sendResponse({ success: true, action: "loginSuccess" }))
        .catch((error) =>
          sendResponse({ success: false, error: error.message })
        );
      return true; // Indicates that the response will be sent asynchronously
    } else if (request.action === "save_url") {
      handleSaveUrl(request.withImages, sendResponse)
        .then(() => sendResponse({ success: true, action: "loginSuccess" }))
        .catch((error) =>
          sendResponse({ success: false, error: error.message })
        );
      return true; // Indicates that the response will be sent asynchronously
    }else if(request.action === "check_token") {

      getToken()
        .then((token) => {
        if(token != null && isTokenExpired(token) === false) {
          sendResponse({
            isTokenValid: true,
            message: "Token is valid.",

          });
        }else{
          sendResponse({
            isTokenValid: false,
            message: "Token expired. Please log in again.",
          });
        }
      }).catch((error) =>
        sendResponse({ success: false, isTokenValid: false, error: error.message })
      );
      return true;
    }
  } catch (error) {
    console.error("Error: ", error.message);
    sendResponse({
      success: false,
      message: "An error occurred. Please try again.",
    });
  }
});

async function handleLogin(credentials, sendResponse) {
  console.log("Background script: Logging in");
  try {
    const response = await fetch(LOGIN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    const data = await handleFetchResponse(response);
    if (data.accessToken) {
      await setToken(data.accessToken);
      return { success: true, message: "Login successful." };
    } else {
      return { success: true, message: "Login successful." };
    }
  } catch (error) {
    return {
      success: false,
      message: "Network error. Please try again.",
    };
  }
}

async function handleSaveUrl(withImages, sendResponse) {
  try {
    const token = await getToken();
    if (!token || isTokenExpired(token)) {
      sendResponse({
        success: false,
        message: "Session expired. Please log in again.",
      });
      return;
    }

    const tabs = await new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true}, (tabs) => {
        if (chrome.runtime.lastError) {
          reject(
            new Error(
              `Error querying tabs: ${chrome.runtime.lastError.message}`
            )
          );
        } else {
          resolve(tabs);
        }
      });
    });
    const url = tabs[0]?.url;

    if (!isValidUrl(url)) {
      sendResponse({ success: false, message: "Invalid URL format" });
      return;
    }

    const response = await fetch(WEBSCRAPING_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ Url: url, FetchImages: withImages }),
    });

    const data = await handleFetchResponse(response);
    sendResponse({ success: true, message: "URL saved successfully!", data });
  } catch (error) {
    sendResponse({
      success: false,
      message: "Network error. Please try again.",
    });
  }
}
