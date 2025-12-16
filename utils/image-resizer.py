import os
from PIL import Image

def resize_image(image_path, output_path, max_size=1000):
    """Resize the image so that the longer edge is at most max_size pixels."""
    with Image.open(image_path) as img:
        # Convert RGBA images to RGB
        if img.mode == 'RGBA':
            img = img.convert('RGB')

        # Calculate the new size while maintaining the aspect ratio
        width, height = img.size
        if width > height:
            new_width = max_size
            new_height = int(height * (max_size / width))
        else:
            new_height = max_size
            new_width = int(width * (max_size / height))

        # Resize the image
        resized_img = img.resize((new_width, new_height))

        # Save the resized image
        resized_img.save(output_path)

def process_directory(directory, max_size=1000):
    """Recursively process all images in the directory and its subdirectories."""
    for root, _, files in os.walk(directory):
        for file in files:
            file_path = os.path.join(root, file)
            if file.lower().endswith(('.jpg', '.jpeg', '.png')):
                print(f"Resizing {file_path}...")
                resize_image(file_path, file_path, max_size)

if __name__ == "__main__":
    # Specify the directory containing your images
    directory = "C:\\Users\\May\\Desktop\\Website\\assets\\projects"

    # Process the directory
    process_directory(directory)

    print("All images have been resized.")