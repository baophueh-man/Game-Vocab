import pymupdf as fitz
import os
import glob
import sys

# Ensure UTF-8 output on Windows
if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8')

def render_pdfs():
    pdf_dir = os.path.join(os.getcwd(), 'test_output_ws1_5')
    img_dir = os.path.join(pdf_dir, 'images')
    os.makedirs(img_dir, exist_ok=True)

    pdf_files = glob.glob(os.path.join(pdf_dir, '*.pdf'))
    print(f"Found {len(pdf_files)} PDF files to render in {pdf_dir}")

    for pdf_path in sorted(pdf_files):
        base_name = os.path.splitext(os.path.basename(pdf_path))[0]
        try:
            doc = fitz.open(pdf_path)
            for page_idx in range(len(doc)):
                page = doc[page_idx]
                pix = page.get_pixmap(dpi=150)
                out_name = f"{base_name}_p{page_idx + 1}.png"
                out_path = os.path.join(img_dir, out_name)
                pix.save(out_path)
                print(f"[OK] Rendered: {out_name} ({pix.width}x{pix.height})")
            doc.close()
        except Exception as e:
            print(f"Error rendering {base_name}: {e}")

if __name__ == '__main__':
    render_pdfs()
