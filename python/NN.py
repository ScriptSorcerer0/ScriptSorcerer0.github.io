import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Input, Dropout
from tensorflow.keras.optimizers import Adam
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error
import xgboost as xgb


data = pd.read_excel('productiontraning.xlsx')

features = data[['Imports 2023', 'Exports 2023']]
target = data['Production']

X_train, X_test, y_train, y_test = train_test_split(features, target, test_size=0.2, random_state=42)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)


model = LinearRegression()
model.fit(X_train_scaled, y_train)

predictions = model.predict(X_test_scaled)

linearmae = mean_absolute_error(y_test, predictions)


model = Sequential()
model.add(Input(shape=(X_train_scaled.shape[1],)))
model.add(Dense(128, activation='relu'))
model.add(Dropout(0.3))
model.add(Dropout(0.3))
model.add(Dense(32, activation='relu'))
model.add(Dense(1, activation='linear'))

optimizer = Adam(learning_rate=0.001)
model.compile(optimizer=optimizer, loss='mean_squared_error', metrics=['mae'])

history = model.fit(X_train_scaled, y_train, epochs=400, batch_size=32, validation_split=0.2)

plt.plot(history.history['val_loss'], label='Validation Loss')
plt.plot(history.history['loss'], label='Training Loss')
plt.xlabel('Epochs')
plt.ylabel('Loss')
plt.legend()
plt.title('Training and Validation Loss')
plt.show()

loss, NNmae = model.evaluate(X_test_scaled, y_test)


xgb_model = xgb.XGBRegressor(n_estimators=100, learning_rate=0.1, random_state=42)
xgb_model.fit(X_train_scaled, y_train)

xgb_predictions = xgb_model.predict(X_test_scaled)

xgb_mae = mean_absolute_error(y_test, xgb_predictions)

print(f'Test Mean Absolute Error (Regression): {linearmae}')
print(f'Test Mean Absolute Error (NN): {NNmae}')
print(f'Test Mean Absolute Error (XGBoost): {xgb_mae}')