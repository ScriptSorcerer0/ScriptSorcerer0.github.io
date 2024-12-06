import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

def create_vector(naics_code, df):
    # Filter data for the given NAICS code
    naics_data = df[df['NAICS'] == naics_code]

    # Create a dictionary to hold the NAIC_PERCENT values for each job title
    vector_dict = {row['OCC_TITLE']: row['NAIC_PERCENT'] for index, row in naics_data.iterrows()}

    return vector_dict


def calculate_cosine_similarity(naics_code1, naics_code2, df):
    # Create vectors for both NAICS codes
    vector1 = create_vector(naics_code1, df)
    vector2 = create_vector(naics_code2, df)

    # Get the union of all job titles
    all_titles = set(vector1.keys()).union(set(vector2.keys()))

    # Create aligned vectors
    vec1 = [vector1.get(title, 0) for title in all_titles]
    vec2 = [vector2.get(title, 0) for title in all_titles]

    # Calculate cosine similarity
    similarity = cosine_similarity([vec1], [vec2])[0][0]
    return similarity



