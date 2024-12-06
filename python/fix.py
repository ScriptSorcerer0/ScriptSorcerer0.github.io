import pandas as pd


def process_chunk(chunk, aggregated_data, chunk_idx, total_chunks):
    """
    Process a single chunk of data by categorizing and aggregating trade data.
    :param chunk: DataFrame chunk to process.
    :param aggregated_data: Dictionary to store aggregated results.
    :param chunk_idx: Current chunk index for progress tracking.
    :param total_chunks: Total number of chunks for progress tracking.
    """
    print(f"Processing chunk {chunk_idx}/{total_chunks}...")

    # Ensure hs_code is 6 digits
    chunk['hs_code'] = chunk['hs_code'].apply(lambda x: f"{int(x):06d}")

    # Map HS codes to their categories
    def map_hs_code_category(hs_code):
        hs_prefix = int(hs_code[:2])
        if 1 <= hs_prefix <= 5:
            return "Animal & Animal Products"
        elif 6 <= hs_prefix <= 15:
            return "Vegetable Products"
        elif 16 <= hs_prefix <= 24:
            return "Foodstuffs"
        elif 25 <= hs_prefix <= 27:
            return "Mineral Products"
        elif 28 <= hs_prefix <= 38:
            return "Chemicals & Allied Industries"
        elif 39 <= hs_prefix <= 40:
            return "Plastics / Rubbers"
        elif 41 <= hs_prefix <= 43:
            return "Raw Hides, Skins, Leather, & Furs"
        elif 44 <= hs_prefix <= 49:
            return "Wood & Wood Products"
        elif 50 <= hs_prefix <= 63:
            return "Textiles"
        elif 64 <= hs_prefix <= 67:
            return "Footwear / Headgear"
        elif 68 <= hs_prefix <= 71:
            return "Stone / Glass"
        elif 72 <= hs_prefix <= 83:
            return "Metals"
        elif 84 <= hs_prefix <= 85:
            return "Machinery / Electrical"
        elif 86 <= hs_prefix <= 89:
            return "Transportation"
        elif 90 <= hs_prefix <= 97:
            return "Miscellaneous"
        else:
            return "Unknown"

    chunk['hs_category'] = chunk['hs_code'].apply(map_hs_code_category)

    # Group by year, country, and HS category
    grouped = chunk.groupby(['year', 'hs_category', 'exporter_name', 'importer_name']).agg({
        'value': 'sum'
    }).reset_index()

    # Update the aggregated data
    for _, row in grouped.iterrows():
        key = (row['year'], row['hs_category'], row['exporter_name'])
        if key not in aggregated_data:
            aggregated_data[key] = {
                'import_value': 0,
                'export_value': 0
            }
        aggregated_data[key]['export_value'] += row['value']

        key = (row['year'], row['hs_category'], row['importer_name'])
        if key not in aggregated_data:
            aggregated_data[key] = {
                'import_value': 0,
                'export_value': 0
            }
        aggregated_data[key]['import_value'] += row['value']

    print(f"Completed processing chunk {chunk_idx}/{total_chunks}.")


def save_aggregated_data(aggregated_data, output_file):
    """
    Save the aggregated data to a TSV file.
    :param aggregated_data: Aggregated trade data dictionary.
    :param output_file: Path to save the TSV file.
    """
    print("Saving aggregated data to file...")
    results = []
    for (year, hs_category, country), values in aggregated_data.items():
        results.append({
            'year': year,
            'hs_category': hs_category,
            'country': country,
            'import_value': values['import_value'],
            'export_value': values['export_value']
        })
    results_df = pd.DataFrame(results)
    results_df.to_csv(output_file, sep='\t', index=False)
    print(f"Data successfully saved to {output_file}.")


def process_large_tsv(input_file, output_file, chunk_size=1_000_000):
    """
    Process a large TSV file in chunks to avoid memory issues.
    :param input_file: Path to the input TSV file.
    :param output_file: Path to the output TSV file.
    :param chunk_size: Number of rows to process in each chunk.
    """
    aggregated_data = {}
    total_chunks = sum(1 for _ in pd.read_csv(input_file, sep='\t', chunksize=chunk_size))
    print(f"Total chunks to process: {total_chunks}")

    for chunk_idx, chunk in enumerate(pd.read_csv(input_file, sep='\t', chunksize=chunk_size), start=1):
        process_chunk(chunk, aggregated_data, chunk_idx, total_chunks)

    save_aggregated_data(aggregated_data, output_file)


if __name__ == "__main__":
    input_path = "D:/trade_i_baci_a_92.tsv/trade_i_baci_a_92.tsv"
    output_path = "D:/allyears_trade_data.tsv"
    process_large_tsv(input_path, output_path)
