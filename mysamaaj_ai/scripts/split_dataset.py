import splitfolders

splitfolders.ratio(
    "dataset",
    output="dataset_split",
    seed=42,
    ratio=(0.8,0.2)
)

print("Dataset split created")