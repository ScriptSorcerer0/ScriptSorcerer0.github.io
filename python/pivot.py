import pandas as pd
from itertools import permutations

def generate_naics_combinations():
    # Load the NAICS codes from the file
    data = pd.read_excel("NAICS_to_SOC.xlsx")
    naics_codes = data['NAICS'].unique()  # Get unique NAICS codes

    # Generate all permutations of the NAICS codes
    naics_combinations = list(permutations(naics_codes, 2))

    # Create a DataFrame from the combinations
    combinations_df = pd.DataFrame(naics_combinations, columns=["NAICS Code 1", "NAICS Code 2"])

    # Save the combinations to an XLSX file
    combinations_df.to_excel("pivot.xlsx", index=False)

if __name__ == "__main__":
    generate_naics_combinations()
