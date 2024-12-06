import pandas as pd

def preprocess_naics_data(naics_code):
    """Function to standardize and convert NAICS codes to integers as strings."""
    return str(int(float(naics_code)))  # Convert to float, then to int, and finally to string

def calculate_napcs_similarity(naics_code1, naics_code2):
    data = pd.read_excel("NAICS_to_NAPCS_Cleaned.xlsx")

    # Standardize the NAICS codes
    data['NAICS Code'] = data['NAICS Code'].astype(str).apply(preprocess_naics_data)
    naics_code1 = preprocess_naics_data(naics_code1)
    naics_code2 = preprocess_naics_data(naics_code2)

    # Check if both NAICS codes exist in the dataset
    if naics_code1 not in data['NAICS Code'].values or naics_code2 not in data['NAICS Code'].values:
        print(f"No matching NAICS codes found: {naics_code1} or {naics_code2}")
        return 0.0

    # Extract NAPCS Codes for both NAICS codes
    napcs_codes1 = data.loc[data['NAICS Code'] == naics_code1, 'NAPCS Codes'].iloc[0]
    napcs_codes2 = data.loc[data['NAICS Code'] == naics_code2, 'NAPCS Codes'].iloc[0]

    # Tokenize and create sets for comparison
    set1 = set(napcs_codes1.split(', '))
    set2 = set(napcs_codes2.split(', '))


    # Calculate Jaccard similarity
    intersection = len(set1.intersection(set2))
    union = len(set1.union(set2))

    if union == 0:
        print(f"No union found between {naics_code1} and {naics_code2}")
        return 0.0

    similarity_score = intersection / union

    # Apply additional weight if there is a non-zero similarity
    if similarity_score > 0:
        similarity_score *= 1  # Weight the similarity more

    # Ensure the score does not exceed 1
    return min(similarity_score, 1.0)

def main():
    # Load the pivot data
    pivot_data = pd.read_excel("pivot.xlsx")
    similarity_scores = []
    total_pairs = len(pivot_data)

    # Iterate over each pair of NAICS codes and calculate the similarity
    for index, row in pivot_data.iterrows():
        naics_code1 = row["NAICS Code 1"]
        naics_code2 = row["NAICS Code 2"]

        # Calculate the NAPCS similarity
        similarity_score = calculate_napcs_similarity(naics_code1, naics_code2)
        similarity_scores.append(similarity_score)

        # Print progress every 10 iterations
        if (index + 1) % 10 == 0 or (index + 1) == total_pairs:
            print(f"Processed {index + 1}/{total_pairs} pairs...")

    # Add the similarity scores to the DataFrame and save the updated Excel file
    pivot_data["Similarity Score"] = similarity_scores
    pivot_data.to_excel("pivot_with_similarity_fixed.xlsx", index=False)
    print("Processing complete. Results saved to 'pivot_with_similarity_fixed.xlsx'.")

if __name__ == "__main__":
    main()
