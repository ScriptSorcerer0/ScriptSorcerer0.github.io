import pandas as pd

def standardize_naics_code(naics_code):
    """Ensure NAICS codes are six characters long, ending with '0's if necessary."""
    naics_code = str(int(float(naics_code)))  # Convert to int to remove .0, then to str
    return naics_code.ljust(6, '0')

def calculate_capital_labor_similarity(naics_code1, naics_code2):
    # Standardize the NAICS codes
    naics_code1 = standardize_naics_code(naics_code1)
    naics_code2 = standardize_naics_code(naics_code2)

    # Load and prepare the data
    data = pd.read_excel("filtered_labor.xlsx")
    data['NAICS'] = data['NAICS'].apply(standardize_naics_code)

    # Filter the data for relevant measures and ensure '2021' column is not empty
    relevant_data = data[(data['Units'] == 'Index (2017=100)') & (data['2021'].notna())]
    output_per_worker = relevant_data[relevant_data['Measure'] == 'Output per worker'][['NAICS', 'Industry', '2021']]
    hourly_compensation = relevant_data[relevant_data['Measure'] == 'Hourly compensation'][['NAICS', 'Industry', '2021']]

    # Merge data based on 'NAICS' and 'Industry'
    merged_data = pd.merge(output_per_worker, hourly_compensation, on=['NAICS', 'Industry'], suffixes=('_output', '_compensation'))

    # Calculate the Capital/Labor ratio and normalize
    merged_data['Capital_Labor_2021'] = merged_data['2021_output'] / merged_data['2021_compensation']
    min_val, max_val = merged_data['Capital_Labor_2021'].min(), merged_data['Capital_Labor_2021'].max()
    if min_val == max_val:  # Avoid division by zero in normalization
        return 0.5

    merged_data['Capital_Labor_2021_normalized'] = (merged_data['Capital_Labor_2021'] - min_val) / (max_val - min_val)

    # Retrieve normalized values for the given NAICS codes
    capital_labor_1 = merged_data.loc[merged_data['NAICS'] == naics_code1, 'Capital_Labor_2021_normalized']
    capital_labor_2 = merged_data.loc[merged_data['NAICS'] == naics_code2, 'Capital_Labor_2021_normalized']

    # Check if values exist for both NAICS codes
    if capital_labor_1.empty or capital_labor_2.empty:
        print(f"No matching data for NAICS codes: {naics_code1} or {naics_code2}")
        return 0.5

    # Calculate and return the similarity score
    similarity_score = 1 - abs(capital_labor_1.iloc[0] - capital_labor_2.iloc[0])
    similarity_score = max(0.0, min(1.0, similarity_score))
    return similarity_score

def main():
    # Load pivot data
    pivot_data = pd.read_excel("pivot.xlsx")
    similarity_scores = []

    # Iterate over each row and calculate similarity
    for index, row in pivot_data.iterrows():
        naics_code1 = row["NAICS Code 1"]
        naics_code2 = row["NAICS Code 2"]

        similarity_score = calculate_capital_labor_similarity(naics_code1, naics_code2)
        similarity_scores.append(similarity_score)

        # Print progress
        if (index + 1) % 10 == 0:
            print(f"Processed {index + 1} pairs out of {len(pivot_data)}")

    # Save the results to a new Excel file
    pivot_data["Capital Labor Similarity Score"] = similarity_scores
    pivot_data.to_excel("capital.xlsx", index=False)
    print("Finished processing and saved results to capital.xlsx")

if __name__ == "__main__":
    main()
