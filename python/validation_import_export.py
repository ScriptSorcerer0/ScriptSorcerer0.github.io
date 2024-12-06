import numpy as np
from data import data, industry, codes, soc_codes
from sklearn.metrics import mean_squared_error, r2_score, explained_variance_score, mean_absolute_error
from sklearn.preprocessing import StandardScaler



def get_import_export_data(country_code, product_codes):
    trade_values = [data[country_code].get(code, 0) for code in product_codes]
    return np.array(trade_values)


def get_industry_composition(soc_codes):
    composition = []
    for soc_code in soc_codes:
        data = industry.get(soc_code, {})
        composition.append([data.get('workers', 0), data.get('tasks', 0), data.get('products', 0),
                            data.get('assets', 0), data.get('capital_labor', 0)])
    return np.array(composition)


def predict_industry_composition(import_export_data, weights=None):
    if weights is None:
        weights = np.ones(import_export_data.shape)
    normalized_data = StandardScaler().fit_transform(import_export_data.reshape(-1, 1))
    return (normalized_data.flatten() * weights)[:len(weights)]


def vectorize_actual_industry_composition(target_soc_codes):
    target_composition = get_industry_composition(target_soc_codes)
    return target_composition.flatten()


def evaluate_model(predicted, actual):
    min_len = min(len(predicted), len(actual))
    predicted = predicted[:min_len]
    actual = actual[:min_len]

    mse = mean_squared_error(actual, predicted)
    mae = mean_absolute_error(actual, predicted)
    r2 = r2_score(actual, predicted)
    explained_variance = explained_variance_score(actual, predicted)
    accuracy = np.mean(np.isclose(predicted, actual, atol=0.1))
    return mse, mae, r2, explained_variance, accuracy


def run_validation_import_export():
    country_code = 'USA'

    import_export_data = get_import_export_data(country_code, codes)
    weights = np.ones(import_export_data.shape)
    predicted_composition = predict_industry_composition(import_export_data, weights)

    actual_composition = vectorize_actual_industry_composition(soc_codes)

    mse, mae, r2, explained_variance, accuracy = evaluate_model(predicted_composition, actual_composition)

    print("\n--- Import/Export Industry Composition Validation ---")
    print(f"Country: {country_code}")
    print(f"Product Codes: {codes}")
    print(f"Predicted Composition: {predicted_composition}")
    print(f"Actual Composition: {actual_composition}")
    print("\nEvaluation Metrics:")
    print(f"Mean Squared Error: {mse:.4f}")
    print(f"Mean Absolute Error: {mae:.4f}")


if __name__ == "__main__":
    run_validation_import_export()

#Estimate in US millions what the annual production of that industyr is - OUTPUT
#What is teh gross output of an industry - US Stat. In Drive -  Employee prodcutivity by indstury.
#Productivity specifically for validation

#Connect at end. When a country uses 