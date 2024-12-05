
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
  const aiuserInput = document.querySelector(".aiuser-input");
  const pivotBtn = document.querySelector(".pivot-btn");
  const aipivotBtn = document.querySelector(".aipivot-btn");
  const naicCodeOutput = document.querySelector(".naic-code");
  let industries = [];
  let naicsData = [];
  let currentCountryName = "";
  let zoomValue = 100;


  async function loadNAICSData() {
    try {
      const naicsResponse = await fetch("NAICS.xlsx");
      const naicsBuffer = await naicsResponse.arrayBuffer();
      const naicsWorkbook = XLSX.read(naicsBuffer, { type: "array" });
      const naicsSheet = naicsWorkbook.Sheets[naicsWorkbook.SheetNames[0]];
      naicsData = XLSX.utils.sheet_to_json(naicsSheet); // Populate global variable
      console.log("NAICS Data Loaded:", naicsData);
    } catch (error) {
      console.error("Error loading NAICS data:", error);
    }
  }
  
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
        loading.classList.add("hide");
        container.classList.remove("hide");
      } catch (error) {
        loading.innerText = "";
        console.error(error);
      }
    });
  });

  // Handle AI functionality
  aipivotBtn.addEventListener("click", async () => {
    const inputText = aiuserInput.value.trim();
    console.log("Trimmed Input Text:", inputText);

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
          messages: [{
            role: "user",
            content: `Identify a six digit NAIC code for the following industry description: "${inputText}". You should only respond with the format "NAIC Code: [Code], [Industry Description]."`
          }],
          max_tokens: 50,
        }),
      });
    
      if (!response.ok) throw new Error("Failed to fetch OpenAI API.");
      console.log(inputText)
      const data = await response.json();
      const result = data.choices[0].message.content.trim();
      console.log(result)
      // Process the response
      if (result.startsWith("NAIC Code:")) {
        const match = result.match(/NAIC Code:\s*([0-9]+),\s*(.+)/);
        if (match) {
          const naicCode = match[1]; // Extract the full code
          const industryDescription = match[2].replace(/\s*\[.*?\]$/, "").trim(); // Clean up description
    
          // Check if the first two digits are between 31 and 33
          if (parseInt(naicCode.substring(0, 2)) >= 31 && parseInt(naicCode.substring(0, 2)) <= 33) {
            // Truncate NAIC code to four digits
            const truncatedNaicCode = naicCode.substring(0, 4) + "00";
            console.log("Truncated NAIC Code:", truncatedNaicCode);
    
            // Call submitPivot with the truncated NAIC code
            await submitAIPivot(truncatedNaicCode);
            return;
          } else {
            naicCodeOutput.innerText = "The identified NAIC code is not within the range 31-33.";
          }
        } else {
          naicCodeOutput.innerText = "Failed to parse the response from OpenAI.";
        }
      } else {
        naicCodeOutput.innerText = "Response does not contain a valid NAIC code.";
      }
    } catch (error) {
      naicCodeOutput.innerText = "Error processing the request.";
      console.error(error);
    }
  }
)
    

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
  async function submitAIPivot(truncatedNaicCode) {
    if (!truncatedNaicCode) {
      naicCodeOutput.innerText = "Invalid NAIC code provided.";
      return;
    }
  
    try {
      // Step 1: Load NAICS data from NAICS.xlsx
      const naicsResponse = await fetch("NAICS.xlsx");
      const naicsBuffer = await naicsResponse.arrayBuffer();
      const naicsWorkbook = XLSX.read(naicsBuffer, { type: "array" });
      const naicsSheet = naicsWorkbook.Sheets[naicsWorkbook.SheetNames[0]];
      const naicsData = XLSX.utils.sheet_to_json(naicsSheet);
  
      // Find the NAIC code entry
      const naicsEntry = naicsData.find(row => String(row["NAIC"]).trim() === String(truncatedNaicCode).trim());

      if (!naicsEntry) {
        naicCodeOutput.innerText = "No matching NAIC code found in NAICS.xlsx.";
        return;
      }
      console.log("Truncated NAIC Code:", truncatedNaicCode);
      console.log("Country Data:", countryData);

      const industryDescription = naicsEntry["Description"];
      console.log(`Found NAIC Code: ${truncatedNaicCode}, Description: ${industryDescription}`);
  
      // Step 2: Load country-specific Excel file
      const countryFilePath = `countries/${currentCountryName}.xlsx`;
      const countryResponse = await fetch(countryFilePath);
      if (!countryResponse.ok) {
        throw new Error(`Country file not found: ${countryFilePath}`);
      }
  
      const countryBuffer = await countryResponse.arrayBuffer();
      const countryWorkbook = XLSX.read(countryBuffer, { type: "array" });
      const countrySheet = countryWorkbook.Sheets[countryWorkbook.SheetNames[0]];
      const countryData = XLSX.utils.sheet_to_json(countrySheet);
  
      // Filter rows matching the truncated NAIC code in "NAICS Code 2"
      const matchingRows = countryData.filter(row => String(row["NAICS Code 2"]).trim() === String(truncatedNaicCode));
  
      if (matchingRows.length === 0) {
        naicCodeOutput.innerText = `No matches found for NAIC Code ${truncatedNaicCode} in ${currentCountryName}.`;
        return;
      }
  
      // Step 3: Find the top 3 "Final Pivot Score" values
      const topScores = matchingRows
        .map(row => ({
          score: parseFloat(row["Industry Similarity"]),
          naicsCode1: row["NAICS Code 1"],
        }))
        .filter(entry => !isNaN(entry.score)) // Exclude invalid scores
        .sort((a, b) => b.score - a.score) // Sort by descending score
        .slice(0, 3); // Take top 3 entries
  
      if (topScores.length === 0) {
        naicCodeOutput.innerText = `No valid pivot scores found for NAIC Code ${truncatedNaicCode}.`;
        return;
      }
  
      // Step 4: Add descriptions from NAICS.xlsx for "NAICS Code 1"
      const resultOutput = topScores.map(({ score, naicsCode1 }) => {
        const descriptionEntry = naicsData.find(row => String(row["NAIC"]) === String(naicsCode1));
        const description = descriptionEntry ? descriptionEntry["Description"] : "Description not found";
        return `Score: ${score.toFixed(3)}, NAICS:: ${naicsCode1}, Description: ${description}`;
      }).join("\n\n");
  
      // Step 5: Display results
      naicCodeOutput.innerText = `Top Pivot Scores for NAIC Code ${truncatedNaicCode} (${industryDescription}) in ${currentCountryName}:\n\n${resultOutput}`;
      console.log(`Top Pivot Scores:\n${resultOutput}`);
  
    } catch (error) {
      console.error("Error in submitAIPivot:", error);
      naicCodeOutput.innerText = `An error occurred: ${error.message}`;
    }
  }
  
  
  
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
      const matchingRows = countryData.filter(row =>
        String(row["NAICS Code 2"]).trim() === String(naicCode).trim()
      );
      console.log("Filtered Rows:", matchingRows);
        
      if (matchingRows.length === 0) {
        naicCodeOutput.innerText = `No matches found for NAIC Code ${naicCode} in ${currentCountryName}.`;
        return;
      }
  
      // Step 3: Find the three highest "Final Pivot Score" values
      const topScores = matchingRows
        .map(row => ({
          score: parseFloat(row["Industry Similarity"]),
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
        return `Score: ${score.toFixed(3)}, NAICS: ${naicsCode1}, Description: ${description}`;
      }).join("\n\n");

      // Step 5: Include Description of the Main NAIC Code
      const mainDescriptionEntry = naicsData.find(row => String(row["NAIC"]) === String(naicCode));
      const mainDescription = mainDescriptionEntry ? mainDescriptionEntry["Description"] : "Description not found";

      // Output the results
      naicCodeOutput.innerText = `Top Pivot Scores for NAIC Code ${naicCode} (${mainDescription}) in ${currentCountryName}:\n\n${resultOutput}`;
      console.log(`Top Pivot Scores for NAIC Code ${naicCode} (${mainDescription}):\n${resultOutput}`);


  } catch (error) {
    console.error("Error in submitPivot:", error);
    naicCodeOutput.innerText = `An error occurred: ${error.message}`;
  }
}
  
  // Prompt for API key on page load
  let apiKey = "";



async function getAPI(){
    apiKey = prompt("Please enter your OpenAI API key:");
    console.log("API Key received and set:", apiKey);

    }


window.addEventListener("load", async () => {
  // Load industries immediately, regardless of API key
  loadIndustries();
  await loadNAICSData();
  getAPI()
  if(apiKey){
    const aiInputSection = document.getElementById("ai-input-section");
    aiInputSection.classList.remove("hidden");
  }
  if (!apiKey || apiKey.trim() === "") {
    alert("API key is required for AI-related functionality.");
    console.warn("No API key provided. Hiding AI-related input.");
    
    // Hide only the AI-related input
    const aiInputSection = document.getElementById("ai-input-section");
    if (aiInputSection) 
    return;

  
}});