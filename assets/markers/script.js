const SHEET_URL = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec";
const SHEET_FETCH_URL = "https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/gviz/tq?tqx=out:csv";

const map = L.map("map").setView([0, 0], 2);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors"
}).addTo(map);

let selectedAvatar = localStorage.getItem("avatar") || "assets/markers/01.png";
let username = localStorage.getItem("username") || "";

document.addEventListener("DOMContentLoaded", () => {
  loadAvatars();
  loadUserSetup();
  document.getElementById("confirm-setup").addEventListener("click", saveUserProfile);
});

function loadAvatars() {
  const avatarContainer = document.querySelector(".avatars");
  for (let i = 1; i <= 20; i++) {
    const img = document.createElement("img");
    img.src = `assets/markers/${String(i).padStart(2, "0")}.png`;
    img.alt = `Avatar ${i}`;
    if (selectedAvatar === img.src) img.classList.add("selected");
    img.addEventListener("click", () => selectAvatar(img));
    avatarContainer.appendChild(img);
  }
}

function selectAvatar(img) {
  document.querySelectorAll(".avatars img").forEach(img => img.classList.remove("selected"));
  img.classList.add("selected");
  selectedAvatar = img.src;
}

function loadUserSetup() {
  const usernameInput = document.getElementById("username");
  if (username) {
    usernameInput.value = username;
  }
}

function saveUserProfile() {
  const usernameInput = document.getElementById("username");
  if (usernameInput.value.trim() === "") {
    alert("Please enter a username.");
    return;
  }
  username = usernameInput.value.trim();
  localStorage.setItem("username", username);
  localStorage.setItem("avatar", selectedAvatar);
  alert("Profile saved! Starting location sharing...");
  startLocationSharing();
}

// Store markers by UserID
const userMarkers = {};

async function fetchLocations() {
  const response = await fetch(SHEET_FETCH_URL);
  const data = await response.text();

  const rows = data.split("\n").slice(1); // Skip header
  rows.forEach(row => {
    const [userId, lat, lng] = row.split(",");
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    if (!userMarkers[userId]) {
      userMarkers[userId] = L.marker([latNum, lngNum], {
        icon: L.icon({
          iconUrl: selectedAvatar,
          iconSize: [40, 40]
        })
      }).addTo(map);
    } else {
      userMarkers[userId].setLatLng([latNum, lngNum]);
    }
  });
}

function startLocationSharing() {
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(async (position) => {
      const { latitude, longitude } = position.coords;

      await fetch(SHEET_URL, {
        method: "POST",
        body: JSON.stringify({
          UserID: username,
          Latitude: latitude,
          Longitude: longitude
        })
      });

      map.setView([latitude, longitude], 13);
      fetchLocations();
    });
  } else {
    alert("Geolocation is not supported by your browser.");
  }

  setInterval(fetchLocations, 5000);
}
