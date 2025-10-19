import pandas as pd
import os
import glob

# Set the directory containing all your CSV files
folder_path = r"C:\Users\janna\OneDrive\Desktop\Year 2\PDE2116\Scentify\all_sensor_data"  # e.g., './sensor_data/'

# Find all CSV files in the folder
csv_files = glob.glob(os.path.join(folder_path, '*.csv'))

# List to store individual DataFrames
dataframes = []

# Loop through and read each CSV file
for file in csv_files:
    df = pd.read_csv(file)
    dataframes.append(df)

# Concatenate all DataFrames into one
combined_df = pd.concat(dataframes, ignore_index=True)

# Save the combined DataFrame to a new CSV file
combined_df.to_csv('combined_sensor_data.csv', index=False)

print("Done")
