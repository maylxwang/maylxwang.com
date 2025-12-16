import json
import os
from pathlib import Path

# Load the projects data
with open(r"C:\Users\May\Desktop\Website\json\projects.json", "r", encoding="utf-8") as f:
    projects = json.load(f)

# Function to update project assets
def update_project_assets(project):
    assets_dir = Path(r"C:\Users\May\Desktop\Website\assets\projects") / project["id"]
    assets = {
        "main": None,
        "additional": [],
        "attachments": []
    }

    if assets_dir.exists():
        for file in assets_dir.iterdir():
            if file.is_file():
                if file.suffix.lower() == ".md":
                    continue  # Skip markdown files
                if file.stem == project["id"] and file.suffix.lower() in [".png", ".jpg", ".jpeg", ".gif"]:
                    assets["main"] = file.name
                elif file.stem.startswith(project["id"] + "-") and file.suffix.lower() in [".png", ".jpg", ".jpeg", ".gif"]:
                    assets["additional"].append(file.name)
                elif file.suffix.lower() in [".pdf", ".txt"]:
                    assets["attachments"].append(file.name)

    return assets

# Iterate through all projects and update their assets
for project in projects["bigProjects"] + projects["smallProjects"]:
    if "file" in project:
        del project["file"]
    project["assets"] = update_project_assets(project)

# Save the updated JSON file
with open(r"C:\Users\May\Desktop\Website\json\projects.json", "w", encoding="utf-8") as f:
    json.dump(projects, f, indent=2)