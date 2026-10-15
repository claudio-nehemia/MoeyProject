import sys
import os

if len(sys.argv) < 3:
    print("Usage: python convert_heic.py <input_path> <output_path>")
    sys.exit(1)

input_path = sys.argv[1]
output_path = sys.argv[2]

if not os.path.exists(input_path):
    sys.stderr.write(f"Input file not found: {input_path}\n")
    sys.exit(1)

try:
    from PIL import Image
    import pillow_heif
    pillow_heif.register_heif_opener()

    with Image.open(input_path) as img:
        rgb_img = img.convert('RGB')
        ext = os.path.splitext(output_path)[1].lower()
        fmt = 'JPEG' if ext in ['.jpg', '.jpeg'] else 'PNG'
        rgb_img.save(output_path, fmt)

    print("CONVERT_SUCCESS")
    sys.exit(0)
except Exception as e:
    sys.stderr.write(f"Conversion error: {str(e)}\n")
    sys.exit(1)
