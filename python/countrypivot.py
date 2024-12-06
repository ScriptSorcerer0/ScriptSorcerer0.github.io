import pandas as pd
import os

def process_country_pivot(country_dir, pivot_table_file, pivot_dir):
    # Load the final pivot table file
    pivot_table_df = pd.read_excel(pivot_table_file)

    # Ensure all column names are clean
    pivot_table_df.columns = pivot_table_df.columns.str.strip()

    # Remove rows where NAICS Code 1 and NAICS Code 2 are the same
    pivot_table_df = pivot_table_df[pivot_table_df['NAICS Code 1'] != pivot_table_df['NAICS Code 2']]

    # Ensure the pivot directory exists
    if not os.path.exists(pivot_dir):
        os.makedirs(pivot_dir)

    # Iterate through each country file
    for file_name in os.listdir(country_dir):
        if file_name.endswith('.xlsx') and not file_name.endswith('pivot.xlsx'):  # Process only non-pivot Excel files
            country_name = file_name.replace('.xlsx', '')
            country_file_path = os.path.join(country_dir, file_name)

            # Load the country-specific Excel file
            country_df = pd.read_excel(country_file_path)

            # Ensure all column names are clean
            country_df.columns = country_df.columns.str.strip()

            # Merge production capacities for NAICS Code 1 and NAICS Code 2 with the pivot table
            pivot_merged = pivot_table_df.copy()
            pivot_merged = pivot_merged.merge(
                country_df[['NAIC Code', 'Value']],
                left_on='NAICS Code 1',
                right_on='NAIC Code',
                how='left'
            ).rename(columns={'Value': 'N1 Production Capacity'}).drop(columns=['NAIC Code'])

            pivot_merged = pivot_merged.merge(
                country_df[['NAIC Code', 'Value']],
                left_on='NAICS Code 2',
                right_on='NAIC Code',
                how='left'
            ).rename(columns={'Value': 'N2 Production Capacity'}).drop(columns=['NAIC Code'])

            # Fill NaN values with 0 for production capacities
            pivot_merged['N1 Production Capacity'] = pivot_merged['N1 Production Capacity'].fillna(0)
            pivot_merged['N2 Production Capacity'] = pivot_merged['N2 Production Capacity'].fillna(0)

            # Calculate Production Capacity Ratio
            pivot_merged['Production Capacity Ratio'] = pivot_merged.apply(
                lambda row: (row['N1 Production Capacity'] / row['N2 Production Capacity'])
                if row['N2 Production Capacity'] > 0 else 0, axis=1
            )

            # Select and rename final columns
            final_columns = [
                'NAICS Code 1',
                'NAICS Code 2',
                'Industry Similarity',
                'N1 Production Capacity',
                'N2 Production Capacity',
                'Production Capacity Ratio'
            ]
            pivot_merged = pivot_merged[final_columns]

            # Save the final pivot file for the country in the pivot directory
            output_file_path = os.path.join(pivot_dir, f"{country_name}.xlsx")
            pivot_merged.to_excel(output_file_path, index=False, engine='openpyxl')

            print(f"Created pivot file for {country_name}: {output_file_path}")

# File paths
country_dir = 'countriesunpivoted'  # Directory containing the country-specific Excel files
pivot_table_file = 'final_pivot_table.xlsx'  # The pivot table file with Industry Similarity Score
pivot_dir = 'countries'  # Directory to save pivot files

# Run the script
if __name__ == "__main__":
    process_country_pivot(country_dir, pivot_table_file, pivot_dir)
