import os
import json
import pandas as pd
from flask import Flask, request, jsonify

# Directories for input and output
COUNTRIES_DIR = "countries"  # Input Excel files
COUNTRIES_JSON_DIR = "countriesjson"  # Output JSON files


# Step 1: Convert each country's .xlsx file into its own JSON file
def convert_to_individual_json():
    if not os.path.exists(COUNTRIES_JSON_DIR):
        os.makedirs(COUNTRIES_JSON_DIR)

    for file in os.listdir(COUNTRIES_DIR):
        if file.endswith(".xlsx"):
            country_name = os.path.splitext(file)[0]  # Extract the country name from the file name
            file_path = os.path.join(COUNTRIES_DIR, file)

            try:
                # Read the Excel file into a DataFrame
                df = pd.read_excel(file_path)

                # Select relevant columns
                columns_to_keep = ['NAICS Code 1', 'NAICS Code 2', 'Industry Similarity', 'Production Capacity Ratio']
                if not set(columns_to_keep).issubset(df.columns):
                    raise KeyError(f"One or more required columns are missing in {file}. Found columns: {df.columns}")

                df = df[columns_to_keep]

                # Group rows by NAICS Code 2
                grouped_data = df.groupby('NAICS Code 2').apply(lambda group: group[[
                    'NAICS Code 1', 'Industry Similarity', 'Production Capacity Ratio'
                ]].to_dict(orient='records')).to_dict()

                # Save grouped data as JSON
                output_file = os.path.join(COUNTRIES_JSON_DIR, f"{country_name}.json")
                with open(output_file, "w") as json_file:
                    json.dump(grouped_data, json_file, indent=4)
                print(f"Successfully converted {file} to {output_file}")
            except Exception as e:
                print(f"Error processing {file}: {e}")

# Flask app for API
app = Flask(__name__)


@app.route("/api", methods=["GET"])
def get_pivot_scores():
    # Get country and NAICS code from query parameters
    country = request.args.get("country")
    naics_code = request.args.get("naics_code")

    if not country or not naics_code:
        return jsonify({"error": "Missing 'country' or 'naics_code' query parameter"}), 400

    # Path to the country's JSON file
    country_json_file = os.path.join(COUNTRIES_JSON_DIR, f"{country}.json")

    if not os.path.exists(country_json_file):
        return jsonify({"error": f"Country '{country}' not found in data"}), 404

    try:
        # Load the country's JSON file
        with open(country_json_file, "r") as json_file:
            country_data = json.load(json_file)

        # Filter rows for the given NAICS Code and sort by Industry Similarity
        filtered_data = [row for row in country_data if str(row["NAICS Code 1"]).strip() == str(naics_code).strip()]
        sorted_data = sorted(filtered_data, key=lambda x: x["Industry Similarity"], reverse=True)[:5]

        # Prepare the response
        response = [
            {
                "NAICS Code 1": row["NAICS Code 1"],
                "NAICS Code 2": row["NAICS Code 2"],
                "Industry Similarity": row["Industry Similarity"],
                "Production Capacity Ratio": row["Production Capacity Ratio"]
            }
            for row in sorted_data
        ]

        return jsonify({
            "country": country,
            "naics_code": naics_code,
            "top_industry_similarity": response
        })
    except Exception as e:
        return jsonify({"error": f"Error processing request: {e}"}), 500


if __name__ == "__main__":
    # Convert Excel files to individual JSON files
    convert_to_individual_json()

    # Run the Flask API
    app.run(debug=True, port=5000)
