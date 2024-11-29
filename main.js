let apiKey = "";

// Ensure this runs after the page is fully loaded
window.addEventListener("load", () => {
  setTimeout(() => {
    apiKey = prompt("Please enter your OpenAI API key:");
    if (!apiKey || apiKey.trim() === "") {
      alert("API key is required to proceed.");
      throw new Error("API key is missing. The application cannot proceed.");
    }
    console.log("API Key received and set:", apiKey);
  }, 200); // Use a small delay to ensure the DOM is completely loaded
});

//Get needed element rom the DOM
const map = document.querySelector("svg");
const countries = document.querySelectorAll("path");
const sidePanel = document.querySelector(".side-panel");
const container = document.querySelector(".side-panel .container");
const closeBtn = document.querySelector(".close-btn");
const loading = document.querySelector(".loading");
const zoomInBtn = document.querySelector(".zoom-in");
const zoomOutBtn = document.querySelector(".zoom-out");
const zoomValueOutput = document.querySelector(".zoom-value");
//Data Outputs
const countryNameOutput = document.querySelector(".country-name");
const countryFlagOutput = document.querySelector(".country-flag");
const cityOutput = document.querySelector(".city");
const userInput = document.querySelector(".user-input");
const pivotBtn = document.querySelector(".pivot-btn");
const naicCodeOutput = document.querySelector(".naic-code");

let currentCountryName = "";

//Loop through all countries
countries.forEach((country) => {
  country.addEventListener("click", function (e) {
    userInput.value = ""; // Clear the input field
    naicCodeOutput.innerText = "";
    // Log the target element
    console.log("Clicked element:", e.target);

    // Extract the country name
    let clickedCountryName;
    if (e.target.hasAttribute("name")) {
      clickedCountryName = e.target.getAttribute("name");
    } else if (e.target.classList.value) {
      clickedCountryName = e.target.classList.value;
    } else {
      clickedCountryName = null;
    }

    // Log the extracted country name
    console.log("Extracted Country Name:", clickedCountryName);

    // Validate the country name
    if (!clickedCountryName || clickedCountryName.trim() === "") {
      currentCountryName = null;
      console.error("No valid country name found.");
      naicCodeOutput.innerText = "No valid country selected. Please try again.";
      return;
    }

    // Set the global current country name
    currentCountryName = clickedCountryName.trim();
    console.log("Current Country Name:", currentCountryName);

    // Open the side panel and proceed with other logic
    sidePanel.classList.add("side-panel-open");

    // Fetch country details (e.g., from an API or local data)
    loading.innerText = "Loading...";
    container.classList.add("hide");
    loading.classList.remove("hide");

    fetch(`https://restcountries.com/v3.1/name/${currentCountryName}?fullText=true`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        setTimeout(() => {
          // Display country details
          countryNameOutput.innerText = data[0].name.common;
          countryFlagOutput.src = data[0].flags.png;
          cityOutput.innerText = data[0].capital;

          // Show the container
          countryFlagOutput.onload = () => {
            container.classList.remove("hide");
            loading.classList.add("hide");
          };
        }, 500);
      })
      .catch((error) => {
        console.error("Error fetching country data:", error);
        loading.innerText = "No data to show for selected country";
      });
  });
});

pivotBtn.addEventListener("click", async () => {
  const inputText = userInput.value.trim();
  
  if (!inputText) {
      naicCodeOutput.innerText = "Please enter a valid input.";
      return;
  }
  
  // Show a loading indicator while processing
  naicCodeOutput.innerText = "Processing...";
  
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
              {
                  role: "user",
                  content: `Identify a six digit NAIC code ONLY between 31 and 33 for the following industry description, or indicate if the input is invalid or unclear: "${inputText}". If it is not between 31-33, mention that. It should only be Respond with the format "NAIC Code: [Code], [Industry Description]."`,
              },
          ],
          max_tokens: 50,
      }),
  });
  
  if (!response.ok) {
      throw new Error("Failed to fetch from OpenAI API");
  }
  
  const data = await response.json();
  const responseContent = data.choices[0].message.content.trim();

  // Extract NAIC code and description if valid
  let naicCode = "";
  let industryDescription = "";

  if (responseContent.startsWith("NAIC Code:")) {
      const match = responseContent.match(/NAIC Code:\s*([0-9]+),\s*(.+)/);
      if (match) {
          naicCode = match[1]; // Extract the full code
          industryDescription = match[2].replace(/\s*\[.*?\]$/, "").trim(); // Clean up description

          // Check if the first two digits are between 31 and 33
          if (parseInt(naicCode.substring(0, 2)) >= 31 && parseInt(naicCode.substring(0, 2)) <= 33) {
            // Truncate NAIC code to four digits
            const truncatedNaicCode = naicCode.substring(0, 4) + "00";
            console.log("Truncated NAIC Code:", truncatedNaicCode);
          
            try {
              // Fetch and parse the country-specific Excel file
              const filePath = `countries/${encodeURIComponent(currentCountryName)}.xlsx`; // Adjust to your path
              console.log("Fetching country-specific file from:", filePath);
          
              const excelFile = await fetch(filePath);
              if (!excelFile.ok) {
                throw new Error(`File not found: ${filePath}`);
              }
          
              const arrayBuffer = await excelFile.arrayBuffer();
              const workbook = XLSX.read(arrayBuffer, { type: "array" });
          
              if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
                throw new Error("No sheets found in the Excel file.");
              }
          
              const sheet = workbook.Sheets[workbook.SheetNames[0]];
              const jsonSheet = XLSX.utils.sheet_to_json(sheet);
          
              console.log("Parsed Country-Specific Excel Data:", jsonSheet);
          
              // Filter rows where NAIC Code 2 matches the user's truncated NAIC code
              const filteredRows = jsonSheet.filter((row) => {
                const rowNaicsCode = String(row["NAICS Code 2"]).trim();
                console.log(`Checking row NAICS Code 2: "${rowNaicsCode}"`);
                return rowNaicsCode === truncatedNaicCode;
              });
          
              if (filteredRows.length === 0) {
                console.warn("No matching rows found.");
                naicCodeOutput.innerText = `No rows found for NAIC Code ${truncatedNaicCode}.`;
                return;
              }
          
              // Calculate the highest Final Pivot Score
              const maxPivotScore = filteredRows.reduce((max, row) => {
                const rowNaicsCode = String(row["NAICS Code 2"]).trim();
                const niac1 = String(row["NAICS Code 1"]).trim();
                const pivotScore = parseFloat(String(row["Final Pivot Score"]).trim()) || 0;
              
                // Skip self-matching NAIC codes
                if (String(row["NAICS Code 1"]).trim() === rowNaicsCode) {
                  console.warn(`Skipping self-matching row: ${row}`);
                  return max; // Keep the current max unchanged
                }
              
                console.log("Current Pivot Score:", pivotScore);
                return Math.max(max, pivotScore);
              }, 0);
              
              const naicsWorkbookResponse = await fetch("NAICS.xlsx");
              const naicsWorkbookBuffer = await naicsWorkbookResponse.arrayBuffer();
              const naicsWorkbook = XLSX.read(naicsWorkbookBuffer, { type: "array" });
              const naicsSheet = naicsWorkbook.Sheets[naicsWorkbook.SheetNames[0]];
              const naicsData = XLSX.utils.sheet_to_json(naicsSheet);
              if (maxPivotScore > 0) {
                const roundedPivotScore = maxPivotScore.toFixed(3);
                const naicCode1Description = naicsData.find(entry => String(entry.NAIC) === String(filteredRows.find(row => parseFloat(row["Final Pivot Score"]).toFixed(3) === roundedPivotScore)["NAICS Code 1"]))?.Description || "Description not found";
                naicCodeOutput.innerText = `NAIC Code: ${filteredRows.find(row => parseFloat(row["Final Pivot Score"]).toFixed(3) === roundedPivotScore)["NAICS Code 2"]}.\n\n\n Highest Final Pivot Score: ${roundedPivotScore}.\n NAIC Code 1: ${filteredRows.find(row => parseFloat(row["Final Pivot Score"]).toFixed(3) === roundedPivotScore)["NAICS Code 1"]}, Description: ${naicCode1Description}`;

              } else {
                naicCodeOutput.innerText = `No valid pivot scores found for NAIC Code ${truncatedNaicCode}.`;
              }
            } catch (error) {
              console.error("Error processing country-specific Excel file:", error);
              naicCodeOutput.innerText = error.message || "An error occurred while processing the country-specific Excel file.";
            }
          }
              } else {
                  naicCodeOutput.innerText = `Pivot Matching industry description not found.`;
              }
          } else {
              naicCodeOutput.innerText = `This project does not cover non-manufacturing industries.`;
          }
      }
    catch(error){
      console.error("oops")
    }})

//Add click event to side panel close button 
closeBtn.addEventListener("click", () => {
  //Close the side panel
  sidePanel.classList.remove("side-panel-open");
});

//Variable to contain the current zoom value
let zoomValue = 100;
//Disable zoom out button on load 
zoomOutBtn.disabled = true;

//Add click event to zoom in button
zoomInBtn.addEventListener("click", () => {
  //Enable the zoom out button
  zoomOutBtn.disabled = false;
  //Increment zoom value by 100
  zoomValue += 100;
  /*If the zoom value is under 500 
  (Or whatever you want the zoom in limit to be)*/
  if(zoomValue < 500) {
    //Enable the zoom in button
    zoomInBtn.disabled = false;
  //And if it eaches the limit
  } else {
    //Disable the zoom in button
    zoomInBtn.disabled = true;
  }
  //Set map width and height to zoom value
  map.style.width = zoomValue + "vw";
  map.style.height = zoomValue + "vh";
  //Output zoom value percentage
  zoomValueOutput.innerText = zoomValue + "%";
});
/*Repeat the same process with the zoom out button, 
just decrement the zoom value by 100 and check if it 
is over 100*/ 
zoomOutBtn.addEventListener("click", () => {
  zoomInBtn.disabled = false;
  zoomValue -= 100;
  if(zoomValue > 100) {
    zoomOutBtn.disabled = false;
  } else {
    zoomOutBtn.disabled = true;
  }
  map.style.width = zoomValue + "vw";
  map.style.height = zoomValue + "vh";
  zoomValueOutput.innerText = zoomValue + "%";
});