import "./index.css";
import { listMeasurements, clearContent } from "./dom";

// TODO(developer): Set to client ID and API key from the Developer Console

const CLIENT_ID =
  "461516849400-mvoi8t5gd7j2dapji1kmhlsk23vt9jsq.apps.googleusercontent.com";
const API_KEY = "AIzaSyDjABbFTBdOenG98_YZvT_7Yc2u-xEQNCc";

// Discovery doc URL for APIs used by the quickstart
const DISCOVERY_DOC =
  "https://sheets.googleapis.com/$discovery/rest?version=v4";

const SHEET_ID = "1lXZkLZwbjgINrK53zXMaDxMGVthg5gqESqNoZfqjq0c";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz";

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = "https://www.googleapis.com/auth/spreadsheets";
const limit = 100;
let tokenClient;
let gapiInited = false;
let gisInited = false;

const stored = [];

const dialog = document.querySelector("#add-dialog");
document.getElementById("authorize_button").style.display = "none";
document.getElementById("signout_button").style.display = "none";
document.getElementById("add-open").style.visibility = "hidden";
function ongisReady() {
  let tries = 0;
  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      if (tries > limit) {
        clearInterval(interval);
        reject(new Error("failed to load gis"));
      }
      if (!window.google) {
        tries += 1;
        return;
      }
      gisLoaded();
      clearInterval(interval);
      resolve("loaded gis");
    });
  });
}

function ongapiReady() {
  let tries = 0;
  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      if (tries > limit) {
        clearInterval(interval);
        reject(new Error("failed to load gis"));
      }
      if (!window.gapi) {
        tries += 1;
        return;
      }
      gapiLoaded();
      clearInterval(interval);
      resolve("loaded gis");
    });
  });
}
ongisReady()
  .then((res) => console.log(res))
  .catch((err) => console.log(err));

ongapiReady()
  .then((res) => console.log(res))
  .catch((err) => console.log(err));

function gapiLoaded() {
  window.gapi.load("client", initializeGapiClient);
}

/**
 * Callback after the API client is loaded. Loads the
 * discovery doc to initialize the API.
 */
async function initializeGapiClient() {
  await window.gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: [DISCOVERY_DOC],
  });
  gapiInited = true;
  maybeEnableButtons();
}

/**
 * Callback after Google Identity Services are loaded.
 */
function gisLoaded() {
  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: "", // defined later
  });
  gisInited = true;

  maybeEnableButtons();
}

/**
 * Enables user interaction after all libraries are loaded.
 */
function maybeEnableButtons() {
  if (gapiInited && gisInited) {
    const token = localStorage.getItem("token");

    if (token) {
      window.gapi.client.setToken(JSON.parse(token));
      document.getElementById("signout_button").style.display = "inline-block";
      document.getElementById("add-open").style.visibility = "visible";
      listMajors();
      return;
    }
    document.getElementById("authorize_button").style.display = "inline-block";
  }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick() {
  tokenClient.callback = async (resp) => {
    if (resp.error !== undefined) {
      throw resp;
    }

    localStorage.setItem(
      "token",
      JSON.stringify(window.gapi.client.getToken())
    );
    document.getElementById("signout_button").style.display = "inline-block";
    document.getElementById("authorize_button").style.display = "none";
    document.getElementById("add-open").style.visibility = "visible";
    await listMajors();
  };

  if (window.gapi.client.getToken() === null) {
    // Prompt the user to select a Google Account and ask for consent to share their data
    // when establishing a new session.
    tokenClient.requestAccessToken({ prompt: "consent" });
  } else {
    // Skip display of account chooser and consent dialog for an existing session.
    tokenClient.requestAccessToken({ prompt: "" });
  }
}
document.getElementById("authorize_button").addEventListener("click", () => {
  handleAuthClick();
});

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick() {
  const token = window.gapi.client.getToken();
  if (token !== null) {
    window.google.accounts.oauth2.revoke(token.access_token);
    window.gapi.client.setToken("");
    localStorage.setItem("token", "");
    clearContent();
    document.getElementById("authorize_button").style.display = "inline-block";

    document.getElementById("signout_button").style.display = "none";
    document.getElementById("add-open").style.visibility = "";
  }
}
document.getElementById("signout_button").addEventListener("click", () => {
  handleSignoutClick();
});

async function deleteRow(row) {
  const response = await window.gapi.client.sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requests: [
      {
        deleteDimension: {
          range: {
            sheetId: 0,
            dimension: "ROWS",
            startIndex: row,
            endIndex: row + 1,
          },
        },
      },
    ],
  });
  return response;
}

async function editCell(row, column, values) {
  let response;
  try {
    response = await window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `Sheet1!${column}${row}:${column}${row}`,
      majorDimension: "ROWS",
      valueInputOption: "USER_ENTERED",
      values: [values],
    });
  } catch (err) {
    shouldLogOut(err.status);
  }

  return response;
}

function addMeasurements({ row, id }) {
  const { edits, deleteButton, listItem } = listMeasurements(row);
  deleteButton.addEventListener("click", () => {
    deleteRow(id + 1)
      .then((res) => {
        console.log(res);
        while (listItem.firstChild) {
          listItem.removeChild(listItem.firstChild);
        }
        listItem.remove();
      })
      .catch((err) => console.log(err));
  });
  edits.forEach(
    ({ label, editContainer, container, closeButton, edit, column, value }) => {
      label.addEventListener("click", () => {
        container.style.display = "none";
        editContainer.style.display = "flex";
      });
      closeButton.addEventListener("click", () => {
        container.style.display = "flex";
        editContainer.style.display = "none";
      });
      edit.addEventListener("keyup", (e) => {
        if (e.key === "Enter") {
          editCell(id + 2, ALPHABET[column].toUpperCase(), [edit.value])
            .then((res) => {
              value.textContent = edit.value + `"`;
              stored[id].row[column] = edit.value;
              container.style.display = "flex";
              editContainer.style.display = "none";
            })
            .catch((err) => console.log(err));
        }
      });
    }
  );
}
function shouldLogOut(status) {
  if (status === 401) handleSignoutClick();
}

async function addRow(measure) {
  let response;
  try {
    response = await window.gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: "Sheet1!A1:G1",
      majorDimension: "ROWS",
      valueInputOption: "USER_ENTERED",
      values: [measure],
    });
  } catch (err) {
    console.log(err);
    shouldLogOut(err.status);
    throw new Error("unable to add row");
  }

  return response;
}

async function listMajors() {
  let response;
  try {
    // Fetch first 10 files
    response = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,

      range: "A2:G",
    });
  } catch (err) {
    shouldLogOut(err.status);

    return;
  }
  const range = response.result;

  if (!range || !range.values || range.values.length == 0) {
    document.getElementById("content").innerText = "No Measurements found.";
    return;
  }

  // Flatten to string to display
  range.values.forEach((row, index) => {
    const rowObject = { id: index, row };
    stored.push(rowObject);
    addMeasurements(rowObject);
  });
}

document.querySelector("#add").addEventListener("submit", (e) => {
  const form = new FormData(e.target);
  const measurements = [];
  for (const value of form.values()) {
    measurements.push(value);
  }

  addRow(measurements)
    .then((res) => {
      e.preventDefault();

      console.log(res);

      const rowObject = { id: stored.length, row: measurements };

      stored.push(rowObject);
      addMeasurements(rowObject);
      e.target.reset();
      dialog.close();
    })
    .catch((err) => console.log(err));
});
document.querySelector("#close-modal").addEventListener("click", () => {
  dialog.close();
});

document.querySelector("#add-open").addEventListener("click", () => {
  dialog.showModal();
});

let timeout;

document.querySelector("#search").addEventListener("input", (e) => {
  // filter the stored values, and then refresh the dom
  clearTimeout(timeout);

  timeout = setTimeout(() => {
    const filtered = stored.filter(({ row }) =>
      row[0].toLowerCase().includes(e.target.value.toLowerCase())
    );
    clearContent();
    filtered.forEach((row) => {
      addMeasurements(row);
    });
  }, 500);
  console.log(e.target.value);
});
