const SHEET_URL = "https://script.google.com/macros/s/AKfycbzgRtEcp2ZBLqERAG947frZB_Vnm4DA7Ds50qUN6NchnZCVCjshMesCvF4TBGJ0Zni8/exec"; // Replace with your Apps Script Web App URL
const avatarFolder = "assets/markers/";
const avatarCount = 3; // Number of avatars in the folder

let username = localStorage.getItem("username") || "";
let selectedAvatar = localStorage.getItem("avatar") || `${avatarFolder}01.png`;

// Initialize the map
function initMap() {
  const map = L.map("map").setView([0, 0], 2); // Default view
  const streetView = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '© OpenStreetMap contributors'
  });
  const satelliteView = L.tileLayer("https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", {
    attribution: '© Google',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
  });
  streetView.addTo(map);

  L.control.layers({
    "Street View": streetView,
    "Satellite View": satelliteView
  }).addTo(map);

  return map;
}

// Add a marker to the map
function addMarkerToMap(map, lat, lng, username, avatar) {
  const customIcon = L.icon({
    iconUrl: avatar,
    iconSize: [40, 40],
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

// Fetch and update markers
async function fetchAndUpdateMarkers(map) {
  const response = await fetch(SHEET_URL);
  const users = await response.json();

  users.forEach(user => {
    const { UserID, Latitude, Longitude, Avatar } = user;
    addMarkerToMap(map, Latitude, Longitude, UserID, Avatar || `${avatarFolder}01.png`);
  });
}

// Main function
async function main() {
  const map = initMap();

  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(async (position) => {
      const { latitude, longitude } = position.coords;

      if (saveUserData()) {
        await fetch(SHEET_URL, {
          method: "POST",
          body: JSON.stringify({ UserID: username, Latitude: latitude, Longitude: longitude, Avatar: selectedAvatar })
        });
        addMarkerToMap(map, latitude, longitude, username, selectedAvatar);
      }
    });
  }

  setInterval(() => fetchAndUpdateMarkers(map), 10000); // Refresh markers every 10 seconds
}

// Generate avatars
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

// Change username
function changeUsername() {
  const newUsername = prompt("Enter your new username:");
  if (newUsername) {
    localStorage.setItem("username", newUsername);
    alert(`Username changed to ${newUsername}.`);
  }
}

document.getElementById("start-sharing").addEventListener("click", main);
document.getElementById("change-name").addEventListener("click", changeUsername);

document.getElementById("center-map").addEventListener("click", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;
      map.setView([latitude, longitude], 15); // Adjust zoom level
    });
  } else {
    alert("Geolocation is not supported by your browser.");
  }
});

populateAvatars();

window.onload = () => {
  const savedUsername = localStorage.getItem("username");
  if (savedUsername) {
    alert(`Welcome back, ${savedUsername}!`);
    document.getElementById("username").value = savedUsername;
  }
};
