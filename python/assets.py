import pandas as pd

def standardize_naics_code(naics_code):
    """Standardizes the NAICS code to be three characters long."""
    return str(naics_code).strip()[:3]

def calculate_asset_similarity(naics_code1, naics_code2):
    # Load the assets data
    data = pd.read_excel("assets.xlsx")
    data['NAICS'] = data['NAICS'].apply(standardize_naics_code)

    # Filter data for the given NAICS codes
    data1 = data[data['NAICS'] == naics_code1]
    data2 = data[data['NAICS'] == naics_code2]

    if data1.empty or data2.empty:
        return 0.5

    # Extract the unique technologies for each industry
    technologies1 = set(data1['Technology Use'].unique())
    technologies2 = set(data2['Technology Use'].unique())
    common_technologies = technologies1 & technologies2

    if not common_technologies:
        return 0.0

    differences = {}
    for technology in common_technologies:
        revenue1 = data1.loc[data1['Technology Use'] == technology, 'Revenue'].values[0]
        revenue2 = data2.loc[data2['Technology Use'] == technology, 'Revenue'].values[0]

        # Check and skip if revenue values are 'S' (suppressed) or non-numeric
        if revenue1 == 'S' or revenue2 == 'S':
            continue
        try:
            revenue1_value = float(revenue1)
            revenue2_value = float(revenue2)
        except ValueError:
            continue

        differences[technology] = abs(revenue1_value - revenue2_value)

    if not differences:
        return 0.0

    # Calculate the max and min differences to normalize
    max_difference = max(differences.values())
    min_difference = min(differences.values())

    if max_difference == min_difference:
        overall_score = 0
    else:
        normalized_differences = {
            tech: (diff - min_difference) / (max_difference - min_difference)
            for tech, diff in differences.items()
        }
        overall_score = sum(normalized_differences.values()) / len(normalized_differences)

    # Calculate the similarity score
    similarity_score = 1 - overall_score
    return similarity_score

def main():
    # Load pivot data
    pivot_data = pd.read_excel("pivot.xlsx")
    similarity_scores = []

    # Iterate over each row and calculate similarity
    for index, row in pivot_data.iterrows():
        naics_code1 = standardize_naics_code(row["NAICS Code 1"])
        naics_code2 = standardize_naics_code(row["NAICS Code 2"])

        similarity_score = calculate_asset_similarity(naics_code1, naics_code2)
        similarity_scores.append(similarity_score)

        # Print progress with NAICS code pairs and their similarity
        print(f"NAICS Code Pair: {naics_code1}, {naics_code2} - Similarity Score: {similarity_score}")
        if (index + 1) % 10 == 0:
            print(f"Processed {index + 1} pairs out of {len(pivot_data)}")
    # Save the results to a new Excel file
    pivot_data["Asset Similarity Score"] = similarity_scores
    pivot_data.to_excel("assetfinal.xlsx", index=False)
    print("Finished processing all pairs and saved results to assetfinal.xlsx")

if __name__ == "__main__":
    main()
