import os
import fitz # PyMuPDF

pdf_dir = r"d:\APP ANTIGRAVITY\Game-Vocab\test_output_type16"
png_dir = os.path.join(pdf_dir, "rendered_pngs")
os.makedirs(png_dir, exist_ok=True)

files = [f for f in os.listdir(pdf_dir) if f.endswith(".pdf")]
print(f"Converting {len(files)} PDFs to PNG images...")

for f in files:
    pdf_path = os.path.join(pdf_dir, f)
    doc = fitz.open(pdf_path)
    base_name = os.path.splitext(f)[0]
    for page_num in range(len(doc)):
        page = doc[page_num]
        # 150 DPI is crisp and fast for inspection
        pix = page.get_pixmap(dpi=150)
        out_png = os.path.join(png_dir, f"{base_name}_p{page_num + 1}.png")
        pix.save(out_png)
    doc.close()

print(f"Successfully converted all PDFs to PNGs in: {png_dir}")
