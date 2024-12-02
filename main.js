
  // Get needed elements from the DOM
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
  const aipivotBtn = document.querySelector(".aipivot-btn");
  const naicCodeOutput = document.querySelector(".naic-code");
  let industries = [];
  let currentCountryName = "";
  let zoomValue = 100;

// Load industries from NAIC.xlsx
async function loadIndustries() {
  try {
    const response = await fetch("NAICS.xlsx");
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonSheet = XLSX.utils.sheet_to_json(sheet);

    industries = jsonSheet.map((row) => row["Description"]).filter(Boolean);
  } catch (error) {
    console.error("Error loading industries:", error);
  }
}
// Show the dropdown when the input field is focused
function showDropdown() {
  const dropdown = document.querySelector(".dropdown");

  // Populate the dropdown with all industries when the input is first clicked
  dropdown.innerHTML = ""; // Clear any existing options

  industries.forEach((industry) => {
    const option = document.createElement("option");
    option.value = industry;
    option.textContent = industry;
    dropdown.appendChild(option);
  });

  // Show the dropdown
  dropdown.classList.remove("hidden");
}


// Filter dropdown options based on user input
function filterOptions(query) {
  const dropdown = document.querySelector(".dropdown");
  dropdown.innerHTML = ""; // Clear any existing options

  // Filter industries based on query
  const filtered = industries.filter((industry) =>
    industry.toLowerCase().includes(query.toLowerCase())
  );

  // Populate the dropdown with filtered options
  filtered.forEach((industry) => {
    const option = document.createElement("option");
    option.value = industry;
    option.textContent = industry;
    dropdown.appendChild(option);
  });

  // If no results match, show a "No matches found" message
  if (filtered.length === 0) {
    const noResultOption = document.createElement("option");
    noResultOption.value = "";
    noResultOption.textContent = "No matches found";
    dropdown.appendChild(noResultOption);
  }

  // Show dropdown
  dropdown.classList.remove("hidden");
}


// Set input value based on the selected dropdown option
function selectOption(value) {
  const input = document.querySelector(".user-input");
  input.value = value;

  // Hide dropdown after selection
  const dropdown = document.querySelector(".dropdown");
  dropdown.classList.add("hidden");
}

  // Loop through all countries and add click event listeners
  countries.forEach((country) => {
    country.addEventListener("click", async (e) => {
      try {
        userInput.value = ""; // Clear the input field
        naicCodeOutput.innerText = "";
        loading.classList.remove("hide");

        const clickedCountryName = e.target.getAttribute("name") || e.target.classList.value || null;

        if (!clickedCountryName) {
          naicCodeOutput.innerText = "No valid country selected. Please try again.";
          return;
        }

        currentCountryName = clickedCountryName.trim();
        sidePanel.classList.add("side-panel-open");

        const response = await fetch(`https://restcountries.com/v3.1/name/${currentCountryName}?fullText=true`);
        if (!response.ok) throw new Error("Country data fetch failed.");

        const data = await response.json();
        countryNameOutput.innerText = data[0].name.common;
        countryFlagOutput.src = data[0].flags.png;
        cityOutput.innerText = data[0].capital || "N/A";
        loading.classList.add("hide");
        container.classList.remove("hide");
      } catch (error) {
        loading.innerText = "Failed to load country data.";
        console.error(error);
      }
    });
  });

  // Handle AI functionality
  aipivotBtn.addEventListener("click", async () => {
    const inputText = userInput.value.trim();
    if (!inputText) {
      naicCodeOutput.innerText = "Please enter a valid input.";
      return;
    }

    try {
      naicCodeOutput.innerText = "Processing...";
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: `Identify NAIC code for: "${inputText}".` }],
          max_tokens: 50,
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch OpenAI API.");
      const data = await response.json();
      const result = data.choices[0].message.content.trim();
      naicCodeOutput.innerText = result;
    } catch (error) {
      naicCodeOutput.innerText = "Error processing the request.";
      console.error(error);
    }
  });

  // Close side panel
  closeBtn.addEventListener("click", () => {
    sidePanel.classList.remove("side-panel-open");
  });

  // Zoom logic
  zoomInBtn.addEventListener("click", () => {
    if (zoomValue < 500) {
      zoomValue += 100;
      map.style.width = zoomValue + "vw";
      map.style.height = zoomValue + "vh";
      zoomValueOutput.innerText = `${zoomValue}%`;
      zoomOutBtn.disabled = false;
      if (zoomValue === 500) zoomInBtn.disabled = true;
    }
  });

  zoomOutBtn.addEventListener("click", () => {
    if (zoomValue > 100) {
      zoomValue -= 100;
      map.style.width = zoomValue + "vw";
      map.style.height = zoomValue + "vh";
      zoomValueOutput.innerText = `${zoomValue}%`;
      zoomInBtn.disabled = false;
      if (zoomValue === 100) zoomOutBtn.disabled = true;
    }
  });
  async function submitPivot() {
    const inputDescription = userInput.value.trim();
    if (!inputDescription) {
      naicCodeOutput.innerText = "Please enter or select a valid industry description.";
      return;
    }
  
    try {
      // Step 1: Load NAIC code from NAICS.xlsx
      const naicsResponse = await fetch("NAICS.xlsx");
      const naicsBuffer = await naicsResponse.arrayBuffer();
      const naicsWorkbook = XLSX.read(naicsBuffer, { type: "array" });
      const naicsSheet = naicsWorkbook.Sheets[naicsWorkbook.SheetNames[0]];
      const naicsData = XLSX.utils.sheet_to_json(naicsSheet);
  
      // Find the NAIC code for the given description
      const naicsEntry = naicsData.find(row => row["Description"] === inputDescription);
      if (!naicsEntry || !naicsEntry["NAIC"]) {
        naicCodeOutput.innerText = "No matching NAIC code found for the selected description.";
        return;
      }
  
      const naicCode = naicsEntry["NAIC"];
      console.log(`Found NAIC Code: ${naicCode}`);
  
      // Step 2: Load the country-specific Excel file
      const countryFilePath = `countries/${currentCountryName}.xlsx`;
      const countryResponse = await fetch(countryFilePath);
      if (!countryResponse.ok) {
        throw new Error(`Country file not found: ${countryFilePath}`);
      }
      const countryBuffer = await countryResponse.arrayBuffer();
      const countryWorkbook = XLSX.read(countryBuffer, { type: "array" });
      const countrySheet = countryWorkbook.Sheets[countryWorkbook.SheetNames[0]];
      const countryData = XLSX.utils.sheet_to_json(countrySheet);
  
      // Filter rows matching the NAIC code in "NAICS Code 2"
      const matchingRows = countryData.filter(row => String(row["NAICS Code 2"]).trim() === String(naicCode));
  
      if (matchingRows.length === 0) {
        naicCodeOutput.innerText = `No matches found for NAIC Code ${naicCode} in ${currentCountryName}.`;
        return;
      }
  
      // Step 3: Find the three highest "Final Pivot Score" values
      const topScores = matchingRows
        .map(row => ({
          score: parseFloat(row["Final Pivot Score"]),
          naicsCode1: row["NAICS Code 1"],
        }))
        .filter(entry => !isNaN(entry.score)) // Ensure valid scores
        .sort((a, b) => b.score - a.score) // Sort in descending order
        .slice(0, 3); // Take the top 3
  
      if (topScores.length === 0) {
        naicCodeOutput.innerText = `No valid pivot scores found for NAIC Code ${naicCode}.`;
        return;
      }
  
      // Step 4: Add Descriptions from NAICS.xlsx
    const resultOutput = topScores.map(({ score, naicsCode1 }) => {
      const descriptionEntry = naicsData.find(row => String(row["NAIC"]) === String(naicsCode1));
      const description = descriptionEntry ? descriptionEntry["Description"] : "Description not found";
      return `Score: ${score.toFixed(3)}, NAICS Code 1: ${naicsCode1}, Description: ${description}`;
    }).join("\n\n");

    // Step 5: Output the results
    naicCodeOutput.innerText = `Top Pivot Scores for NAIC Code ${naicCode} in ${currentCountryName}:\n\n${resultOutput}`;
    console.log(`Top Pivot Scores:\n${resultOutput}`);

  } catch (error) {
    console.error("Error in submitPivot:", error);
    naicCodeOutput.innerText = `An error occurred: ${error.message}`;
  }
}
  
  // Prompt for API key on page load
  let apiKey = "";

window.addEventListener("load", () => {
  // Load industries immediately, regardless of API key
  loadIndustries();

  // Prompt for API key and handle AI-specific input visibility
  setTimeout(() => {
    apiKey = prompt("Please enter your OpenAI API key:");
    if (!apiKey || apiKey.trim() === "") {
      alert("API key is required for AI-related functionality.");
      console.warn("No API key provided. Hiding AI-related input.");
      
      // Hide only the AI-related input
      const aiInputSection = document.getElementById("ai-input-section");
      if (aiInputSection) aiInputSection.classList.add("hidden");
      
      return;
    }

    console.log("API Key received and set:", apiKey);

    // Show the AI-related input if the API key is provided
    const aiInputSection = document.getElementById("ai-input-section");
    if (aiInputSection) aiInputSection.classList.remove("hidden");
  }, 200); // Use a small delay to ensure the DOM is completely loaded
});

