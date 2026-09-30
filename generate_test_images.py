import base64
import json
from io import BytesIO
from PIL import Image, ImageDraw

words = ['bell', 'duck', 'pen', 'pencil', 'cat', 'apple']
colors = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899']

result = {}
for w, c in zip(words, colors):
    img = Image.new('RGB', (120, 120), color='#ffffff')
    draw = ImageDraw.Draw(img)
    # Draw border
    draw.rectangle([2, 2, 117, 117], outline='#cbd5e1', width=3)
    # Draw colored shape
    draw.ellipse([20, 20, 100, 100], fill=c)
    # Draw text label in center
    # Pillow default font
    draw.text((40, 50), w[:4], fill='#ffffff')
    
    buf = BytesIO()
    img.save(buf, format='JPEG', quality=95)
    b64 = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode('utf-8')
    result[w] = b64

with open('test_images_b64.json', 'w') as f:
    json.dump(result, f, indent=2)

print("Created 6 test JPEG images with labels and colors!")
