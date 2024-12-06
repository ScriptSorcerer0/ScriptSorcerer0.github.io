import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# Load the data from the Excel file
file_path = 'workerupdated.xlsx'
df = pd.read_excel(file_path)

def create_task_vector(naics_code, df):
    # Filter data for the given NAICS code
    naics_data = df[df['NAICS'] == naics_code]

    # Create a dictionary to hold the task counts for each task ID
    task_dict = {}
    for _, row in naics_data.iterrows():
        # Iterate over task columns
        for col in df.columns:
            if col.startswith("Task"):
                task_id = row[col]
                if pd.notna(task_id):  # Ensure task_id is not NaN
                    task_dict[task_id] = task_dict.get(task_id, 0) + 1

    return task_dict

def calculate_task_cosine_similarity(naics_code1, naics_code2, df):
    # Create task vectors for both NAICS codes
    vector1 = create_task_vector(naics_code1, df)
    vector2 = create_task_vector(naics_code2, df)

    # Get the union of all task IDs
    all_tasks = set(vector1.keys()).union(set(vector2.keys()))

    # Create aligned vectors
    vec1 = [vector1.get(task, 0) for task in all_tasks]
    vec2 = [vector2.get(task, 0) for task in all_tasks]

    # Calculate cosine similarity
    similarity = cosine_similarity([vec1], [vec2])[0][0]
    return similarity

# Example usage

