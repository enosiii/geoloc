const SHEET_URL = "https://script.google.com/macros/s/AKfycbzgRtEcp2ZBLqERAG947frZB_Vnm4DA7Ds50qUN6NchnZCVCjshMesCvF4TBGJ0Zni8/exec";
const avatarFolder = "assets/markers/";
const avatarCount = 03; // Number of avatars in the folder

let username = localStorage.getItem("username") || "";
let selectedAvatar = localStorage.getItem("avatar") || `${avatarFolder}01.png`;

// Initialize the map
function initMap() {
  const map = L.map("map").setView([0, 0], 2); // Default view (world)
  
  // Add a tile layer (using Leaflet with OpenStreetMap)
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  return map;
}

// Add the user's marker to the map
function addMarkerToMap(map, lat, lng, username, avatar) {
  const customIcon = L.icon({
    iconUrl: avatar,
    iconSize: [40, 40], // Customize marker size
    iconAnchor: [20, 40],
  });

  L.marker([lat, lng], { icon: customIcon })
    .bindPopup(`<b>${username}</b>`)
    .addTo(map);
}

// Save username and avatar
function saveUserData() {
  username = document.getElementById("username").value.trim();
  if (!username) {
    alert("Please enter a username!");
    return false;
  }

  localStorage.setItem("username", username);
  localStorage.setItem("avatar", selectedAvatar);
  return true;
}

// Fetch all users from Google Sheets and display them on the map
async function fetchAndUpdateMarkers(map) {
  const response = await fetch(SHEET_URL);
  const users = await response.json();

  users.forEach(user => {
    const { UserID, Latitude, Longitude } = user;
    const avatarPath = `${avatarFolder}${user.UserID}.png` || `${avatarFolder}01.png`;
    addMarkerToMap(map, Latitude, Longitude, UserID, avatarPath);
  });
}

// Main function
async function main() {
  const map = initMap();

  // Center map on user's location
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(async (position) => {
      const { latitude, longitude } = position.coords;

      if (saveUserData()) {
        // Post user's data to Google Sheets
        await fetch(SHEET_URL, {
          method: "POST",
          body: JSON.stringify({ UserID: username, Latitude: latitude, Longitude: longitude })
        });

        // Add or update user's marker
        addMarkerToMap(map, latitude, longitude, username, selectedAvatar);
      }
    });
  }

  // Fetch and display all users
  setInterval(() => fetchAndUpdateMarkers(map), 10000); // Update every 10 seconds
}

// Generate avatar selection
function populateAvatars() {
  const avatarList = document.getElementById("avatar-list");
  for (let i = 1; i <= avatarCount; i++) {
    const avatarPath = `${avatarFolder}${String(i).padStart(2, "0")}.png`;
    const img = document.createElement("img");

    img.src = avatarPath;
    img.className = "avatar";
    img.addEventListener("click", () => {
      document.querySelectorAll(".avatar").forEach(el => el.classList.remove("selected"));
      img.classList.add("selected");
      selectedAvatar = avatarPath;
    });

    if (avatarPath === selectedAvatar) img.classList.add("selected");
    avatarList.appendChild(img);
  }
}

// Start sharing button handler
document.getElementById("start-sharing").addEventListener("click", main);

// Populate avatars on page load
populateAvatars();
