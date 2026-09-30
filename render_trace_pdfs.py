import os
import fitz # PyMuPDF

pdf_dir = r"d:\APP ANTIGRAVITY\Game-Vocab\test_output"
png_dir = r"d:\APP ANTIGRAVITY\Game-Vocab\test_output\images"
os.makedirs(png_dir, exist_ok=True)

files = [f for f in os.listdir(pdf_dir) if f.startswith('trace_') and f.endswith('.pdf')]
files.sort()

print(f"Found {len(files)} Trace PDF files to render to images...")

for f in files:
    pdf_path = os.path.join(pdf_dir, f)
    base_name = os.path.splitext(f)[0]
    try:
        doc = fitz.open(pdf_path)
        for page_idx in range(len(doc)):
            page = doc[page_idx]
            pix = page.get_pixmap(dpi=150)
            out_img = os.path.join(png_dir, f"{base_name}_p{page_idx+1}.png")
            pix.save(out_img)
            print(f"Rendered: {out_img}")
        doc.close()
    except Exception as e:
        print(f"Error rendering {f}: {e}")

print("Trace PDF pages rendered to PNG successfully!")
