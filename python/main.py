import pandas as pd
import time
from products import calculate_napcs_similarity
from assets import calculate_asset_similarity
from capital_labor import calculate_capital_labor_similarity

def load_data():
    start = time.time()
    pivot_data = pd.read_excel("pivot.xlsx")
    print(f"Loaded pivot.xlsx in {time.time() - start:.2f} seconds")

    start = time.time()
    napcs_data = pd.read_excel("NAICS_to_NAPCS_Cleaned.xlsx")
    print(f"Loaded NAICS_to_NAPCS_Cleaned.xlsx in {time.time() - start:.2f} seconds")

    start = time.time()
    assets_data = pd.read_excel("assets.xlsx")
    print(f"Loaded assets.xlsx in {time.time() - start:.2f} seconds")

    start = time.time()
    labor_data = pd.read_excel("filtered_labor.xlsx")
    print(f"Loaded filtered_labor.xlsx in {time.time() - start:.2f} seconds")

    return pivot_data, napcs_data, assets_data, labor_data

def main():
    pivot_data, napcs_data, assets_data, labor_data = load_data()

    napcs_similarity_scores = []
    asset_similarity_scores = []
    capital_labor_similarity_scores = []

    for index, row in pivot_data.iterrows():
        naics_code1 = str(row["NAICS Code 1"]).strip()
        naics_code2 = str(row["NAICS Code 2"]).strip()

        try:
            # Calculate NAPCS similarity
            napcs_similarity = calculate_napcs_similarity(naics_code1, naics_code2)
            napcs_similarity_scores.append(napcs_similarity)

            # Calculate asset similarity
            asset_similarity = calculate_asset_similarity(naics_code1, naics_code2)
            asset_similarity_scores.append(asset_similarity)

            # Calculate capital/labor similarity
            capital_labor_similarity = calculate_capital_labor_similarity(naics_code1, naics_code2)
            capital_labor_similarity_scores.append(capital_labor_similarity)

            print(f"Processed row {index + 1}")

        except Exception as e:
            print(f"Error processing row {index + 1}: {e}")
            napcs_similarity_scores.append(None)
            asset_similarity_scores.append(None)
            capital_labor_similarity_scores.append(None)

    # Add the similarity scores to the pivot_data DataFrame
    pivot_data["NAPCS Similarity"] = napcs_similarity_scores
    pivot_data["Asset Similarity"] = asset_similarity_scores
    pivot_data["Capital/Labor Similarity"] = capital_labor_similarity_scores

    # Save the updated pivot_data to a new Excel file
    pivot_data.to_excel("therest.xlsx", index=False)
    print("Saved similarity scores to therest.xlsx")

if __name__ == "__main__":
    main()
