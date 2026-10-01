import os
import glob
import fitz # PyMuPDF

def render_pdfs_to_images():
    pdf_dir = os.path.join(os.getcwd(), 'test_output_type14')
    pdf_files = sorted(glob.glob(os.path.join(pdf_dir, '*.pdf')))
    print(f"Found {len(pdf_files)} PDF files in {pdf_dir}")

    for pdf_path in pdf_files:
        base_name = os.path.splitext(os.path.basename(pdf_path))[0]
        try:
            doc = fitz.open(pdf_path)
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                # 150 DPI for crisp worksheet rendering
                pix = page.get_pixmap(dpi=150)
                out_png = os.path.join(pdf_dir, f"{base_name}_page{page_num + 1}.png")
                pix.save(out_png)
                print(f"Saved: {out_png}")

                # Also save a zoomed/cropped version focusing directly on the Type 14 worksheet grid
                # Rect coordinates: (x0, y0, x1, y1) in points (72 pt per inch)
                # For A4: width ~595 pt, height ~842 pt
                # Crop header margin to focus closely on the 8 cards
                page_rect = page.rect
                # Crop to upper-middle body where worksheet content lives
                crop_rect = fitz.Rect(page_rect.x0, page_rect.y0 + 40, page_rect.x1, page_rect.y1 - 60)
                crop_pix = page.get_pixmap(dpi=180, clip=crop_rect)
                focused_png = os.path.join(pdf_dir, f"{base_name}_focused.png")
                crop_pix.save(focused_png)
                print(f"Saved Focused WS View: {focused_png}")

            doc.close()
        except Exception as e:
            print(f"Error processing {pdf_path}: {e}")

if __name__ == '__main__':
    render_pdfs_to_images()
