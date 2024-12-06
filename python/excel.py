import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from tqdm import tqdm  # For progress indicator

# Load the data from the Excel files
df = pd.read_excel('workerupdated.xlsx')
pivot_data = pd.read_excel('pivot.xlsx')

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

    # Check if vectors are empty
    if len(vec1) == 0 or len(vec2) == 0:
        return 0.0  # Return a default similarity score if either vector is empty

    # Calculate cosine similarity
    similarity = cosine_similarity([vec1], [vec2])[0][0]
    return similarity

# Initialize an empty list to store similarity scores
similarity_scores = []

# Use tqdm to display a progress bar
for index, row in tqdm(pivot_data.iterrows(), total=pivot_data.shape[0], desc="Processing NAICS pairs"):
    naics_code1 = row["NAICS Code 1"]
    naics_code2 = row["NAICS Code 2"]

    # Calculate the similarity score and append it to the list
    try:
        score = calculate_task_cosine_similarity(naics_code1, naics_code2, df)
        similarity_scores.append(score)
    except Exception as e:
        print(f"Error processing row {index}: {e}")
        similarity_scores.append(None)

# Add the similarity scores to the pivot_data DataFrame
pivot_data["Task Cosine Similarity"] = similarity_scores

# Save the updated DataFrame to a new Excel file
pivot_data.to_excel("workeractivitiesdone.xlsx", index=False)
print("Saved results to workeractivitiesdone.xlsx")
