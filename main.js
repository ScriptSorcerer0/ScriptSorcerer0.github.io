//Get needed elements from the DOM
const map = document.querySelector("svg");
const countries = document.querySelectorAll("path");
const sidePanel = document.querySelector(".side-panel");
const container = document.querySelector(".side-panel .container");
const closeBtn = document.querySelector(".close-btn");
const loading = document.querySelector(".loading");
const zoomInBtn = document.querySelector(".zoom-in");
const zoomOutBtn = document.querySelector(".zoom-out");
const zoomValueOutput = document.querySelector(".zoom-value");
const countryNameOutput = document.querySelector(".country-name");
const countryFlagOutput = document.querySelector(".country-flag");
const cityOutput = document.querySelector(".city");
const userInput = document.querySelector(".user-input");
const pivotBtn = document.querySelector(".pivot-btn");
const naicCodeOutput = document.querySelector(".naic-code");
const dropdownList = document.querySelector(".dropdown-list");

let currentCountryName = "";

// Sample list of words for the dropdown
const wordList = ["Agriculture", "Construction", "Manufacturing", "Technology", "Healthcare", "Finance", "Education", "Retail", "Logistics", "Energy"];

// Populate the dropdown list
wordList.forEach(word => {
    const option = document.createElement("div");
    option.classList.add("dropdown-item");
    option.innerText = word;
    dropdownList.appendChild(option);

    option.addEventListener("click", () => {
        userInput.value = word; // Set the input value to the selected word
        dropdownList.classList.add("hide"); // Hide the dropdown after selection
    });
});

// Show filtered dropdown on user input
userInput.addEventListener("input", () => {
    const filter = userInput.value.toLowerCase();
    dropdownList.classList.remove("hide");

    // Filter dropdown items based on input
    document.querySelectorAll(".dropdown-item").forEach(item => {
        if (item.innerText.toLowerCase().includes(filter)) {
            item.style.display = "block";
        } else {
            item.style.display = "none";
        }
    });

    if (!filter) {
        dropdownList.classList.add("hide");
    }
});

// Hide dropdown when clicking outside
window.addEventListener("click", (e) => {
    if (!userInput.contains(e.target) && !dropdownList.contains(e.target)) {
        dropdownList.classList.add("hide");
    }
});

// Handle country selection
countries.forEach((country) => {
    country.addEventListener("click", function (e) {
        userInput.value = ""; // Clear the input field
        naicCodeOutput.innerText = "";

        let clickedCountryName;
        if (e.target.hasAttribute("name")) {
            clickedCountryName = e.target.getAttribute("name");
        } else if (e.target.classList.value) {
            clickedCountryName = e.target.classList.value;
        } else {
            clickedCountryName = null;
        }

        if (!clickedCountryName || clickedCountryName.trim() === "") {
            currentCountryName = null;
            console.error("No valid country name found.");
            naicCodeOutput.innerText = "No valid country selected. Please try again.";
            return;
        }

        currentCountryName = clickedCountryName.trim();
        sidePanel.classList.add("side-panel-open");
    });
});

// Close side panel
closeBtn.addEventListener("click", () => {
    sidePanel.classList.remove("side-panel-open");
});

// Handle zoom functionality
let zoomValue = 100;
zoomOutBtn.disabled = true;

zoomInBtn.addEventListener("click", () => {
    zoomOutBtn.disabled = false;
    zoomValue += 100;
    if (zoomValue < 500) {
        zoomInBtn.disabled = false;
    } else {
        zoomInBtn.disabled = true;
    }
    map.style.width = zoomValue + "vw";
    map.style.height = zoomValue + "vh";
    zoomValueOutput.innerText = zoomValue + "%";
});

zoomOutBtn.addEventListener("click", () => {
    zoomInBtn.disabled = false;
    zoomValue -= 100;
    if (zoomValue > 100) {
        zoomOutBtn.disabled = false;
    } else {
        zoomOutBtn.disabled = true;
    }
    map.style.width = zoomValue + "vw";
    map.style.height = zoomValue + "vh";
    zoomValueOutput.innerText = zoomValue + "%";
});
