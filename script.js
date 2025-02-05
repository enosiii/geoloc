const SHEET_URL = "https://script.google.com/macros/s/AKfycbzgRtEcp2ZBLqERAG947frZB_Vnm4DA7Ds50qUN6NchnZCVCjshMesCvF4TBGJ0Zni8/exec"; // Replace with your Apps Script Web App URL
const avatarFolder = "assets/markers/";
const avatarCount = 7; // Number of avatars in the folder

let username = localStorage.getItem("username") || "";
let selectedAvatar = localStorage.getItem("avatar") || `${avatarFolder}01.png`;

let markers = {}; // Object to store markers by username
let map; // Define the map globally
let watchId = null; // To track the geolocation watchPosition ID
let lastUpdateTimestamp = 0;
const UPDATE_COOLDOWN = 10000; // 10 seconds

// Initialize the map
function initMap() {
  map = L.map("map").setView([0, 0], 2); // Default view
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
}

/*// Add or update a marker on the map
function updateMarker(map, lat, lng, username, avatar, timestamp) {
  console.log(`Updating marker for ${username} at (${lat}, ${lng}) with avatar ${avatar}`);

  if (markers[username]) {
    map.removeLayer(markers[username]);
  }

  const customIcon = L.icon({
    iconUrl: avatar,
    iconSize: [80, 80],
    iconAnchor: [20, 80],
  });

  const lastUpdated = timestamp ? calculateTimeDifference(new Date(timestamp)) : "--";

  const marker = L.marker([lat, lng], { icon: customIcon })
    .bindPopup(`<b>${username}</b><br>${lastUpdated}`);
  marker.addTo(map);

  markers[username] = marker;
}*/

function updateMarker(map, lat, lng, username, avatar, timestamp) {
  console.log(`Updating marker for ${username} at (${lat}, ${lng}) with avatar ${avatar}`);

  if (markers[username]) {
    map.removeLayer(markers[username]);
  }

  // Determine icon size based on screen width
  const isMobile = window.innerWidth < 768; // Check if screen width is less than 768px
  const iconSize = isMobile ? [50, 50] : [80, 80]; // Smaller size for mobile, larger for desktop
  const iconAnchor = isMobile ? [25, 50] : [40, 80]; // Adjust anchor point accordingly

  const customIcon = L.icon({
    iconUrl: avatar,
    iconSize: iconSize, // Dynamic size based on screen width
    iconAnchor: iconAnchor, // Dynamic anchor based on screen width
  });

  const lastUpdated = timestamp ? calculateTimeDifference(new Date(timestamp)) : "--";

  const marker = L.marker([lat, lng], { icon: customIcon })
    .bindPopup(`<b>${username}</b><br>${lastUpdated}`);
  marker.addTo(map);

  markers[username] = marker;
}

// Calculate time difference for display
function calculateTimeDifference(timestamp) {
  const now = new Date();
  const diffInMinutes = Math.floor((now - timestamp) / (1000 * 60));

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  return diffInHours === 1 ? "1 hr ago" : `${diffInHours} hrs ago`;
}

// Save username and avatar (only for first-time users)
function saveUserData() {
  if (!username) { // Only prompt for a username if not already set
    const inputUsername = document.getElementById("username").value.trim();
    if (!inputUsername) {
      alert("Please enter a username!");
      return false;
    }
    username = inputUsername; // Set username
    localStorage.setItem("username", username);
  }
  localStorage.setItem("avatar", selectedAvatar);
  return true;
}

// Fetch and update markers
async function fetchAndUpdateMarkers(map) {
  const spinner = document.getElementById("loading-spinner");
  spinner.style.display = "block"; // Show spinner

  try {
    const response = await fetch(SHEET_URL);
    if (!response.ok) throw new Error("Failed to fetch data");
    const users = await response.json();

    if (users.length === 0) {
      console.log("No users found.");
    }

    users.forEach(user => {
      const { UserID, Latitude, Longitude, Avatar, Timestamp } = user;
      updateMarker(map, Latitude, Longitude, UserID, Avatar || `${avatarFolder}01.png`, Timestamp);
    });
  } catch (error) {
    console.error("Error fetching markers:", error);
  } finally {
    spinner.style.display = "none"; // Hide spinner
  }
}

// Center the map on the user's location
function centerMap(lat, lng) {
  map.setView([lat, lng], 16); // Adjust zoom level
}

function centerMapOnLoad() {
  map.setView([14.87, 120.826], 14); // Adjust zoom level
}

// Update user data on Google Sheets
async function updateUserOnSheet(lat, lng) {
  await fetch(SHEET_URL, {
    method: "POST",
    body: JSON.stringify({ UserID: username, Latitude: lat, Longitude: lng, Avatar: selectedAvatar })
  });
  showNotification("Location updated successfully!");
}

// Stop sharing location
function stopSharing() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
    showNotification("Location sharing stopped.");
  }
  // Clear the user's marker
  if (markers[username]) {
    map.removeLayer(markers[username]);
    delete markers[username];
  }
}

// Main function to start location sharing
async function main() {
  if (!username) {
    if (!saveUserData()) return; // Ensure username is saved for new users
  }

  if (navigator.geolocation) {
    watchId = navigator.geolocation.watchPosition(async (position) => {
      const now = Date.now();
      if (now - lastUpdateTimestamp < UPDATE_COOLDOWN) return; // Cooldown check

      const { latitude, longitude } = position.coords;
      lastUpdateTimestamp = now;

      await updateUserOnSheet(latitude, longitude);
      updateMarker(map, latitude, longitude, username, selectedAvatar);
    }, (error) => {
      console.error("Geolocation error:", error);
      alert("Unable to retrieve your location. Please enable geolocation permissions.");
    }, {
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 5000,
    });
  } else {
    alert("Geolocation is not supported by your browser.");
  }

  setInterval(() => fetchAndUpdateMarkers(map), 3000);
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
      showNotification(`Avatar selected: ${avatarPath}`);
    });

    if (avatarPath === selectedAvatar) img.classList.add("selected");
    avatarList.appendChild(img);
  }
}

// Change username
async function changeUsername() {
  const newUsername = prompt("Enter your new username:");
  if (newUsername && newUsername !== username) {
    const response = await fetch(SHEET_URL, {
      method: "POST",
      body: JSON.stringify({
        UserID: username, // Old username to identify the record
        NewUserID: newUsername, // New username to update
        Latitude: null,
        Longitude: null,
        Avatar: selectedAvatar,
      }),
    });

    const result = await response.json();
    if (result.status === "success") {
      localStorage.setItem("username", newUsername);
      showNotification(`Username changed to ${newUsername}`);
      location.reload();
    } else {
      alert(`Failed to update username: ${result.message}`);
    }
  }
}

// Greet returning users or show username input
function greetUser() {
  const usernameSection = document.getElementById("username-section");
  const greetLabel = document.getElementById("greet-label");

  if (username) {
    greetLabel.textContent = `Hello, ${username}`;
    usernameSection.style.display = "none";
  } else {
    greetLabel.textContent = "";
    usernameSection.style.display = "block";
  }
}

// Show notifications
function showNotification(message, duration = 3000) {
  const notification = document.getElementById("notification");
  notification.textContent = message;
  notification.style.display = "block";
  setTimeout(() => {
    notification.style.display = "none";
  }, duration);
}

// Adjust map height dynamically
function adjustMapHeight() {
  const mapElement = document.getElementById("map");
  const navbarHeight = document.querySelector(".navbar").offsetHeight;
  const containerHeight = document.querySelector(".container").offsetHeight;
  mapElement.style.height = `${window.innerHeight - navbarHeight - containerHeight}px`;
}

// Event listeners
document.getElementById("start-sharing").addEventListener("click", main);
document.getElementById("change-name").addEventListener("click", changeUsername);
document.getElementById("refresh-page").addEventListener("click", () => {
  const currentUrl = window.location.href.split("?")[0];
  window.location.href = `${currentUrl}?refresh=${new Date().getTime()}`;
});
document.getElementById("center-map").addEventListener("click", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;
      centerMap(latitude, longitude);
    });
  } else {
    alert("Geolocation is not supported by your browser.");
  }
});
document.getElementById("clear-markers").addEventListener("click", () => {
  Object.values(markers).forEach(marker => map.removeLayer(marker));
  markers = {};
  showNotification("All markers cleared.");
});
document.getElementById("stop-sharing").addEventListener("click", stopSharing);

// Initialize the app
populateAvatars();
window.onload = () => {
  greetUser();
  initMap();
  adjustMapHeight();
  centerMapOnLoad();
  setInterval(() => fetchAndUpdateMarkers(map), 3000);
};

window.addEventListener("resize", adjustMapHeight);
