import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from app.core.config import settings

OUTPUT_DIR = os.path.join(settings.DOCUMENT_UPLOAD_DIR, "generated_docs")
os.makedirs(OUTPUT_DIR, exist_ok=True)


def generate_docx(document_id: str, title: str, content: str) -> str:
    """Generate a formatted .docx file and return its file path."""
    doc = docx.Document()

    # Set standard margins (1 inch)
    for section in doc.sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)

    # Document Header
    header_para = doc.add_paragraph()
    header_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title_run = header_para.add_run(f"LEGAL DRAFT: {title.upper()}\n")
    title_run.bold = True
    title_run.font.size = Pt(16)
    title_run.font.color.rgb = RGBColor(16, 42, 67)  # Navy blue

    sub_run = header_para.add_run("Draft Generated via LegalAI – For Review & Verification Only\n")
    sub_run.italic = True
    sub_run.font.size = Pt(9)
    sub_run.font.color.rgb = RGBColor(130, 154, 177)

    # Divider
    divider = doc.add_paragraph()
    divider.paragraph_format.space_after = Pt(12)

    # Document Content Body
    lines = content.split("\n")
    for line in lines:
        stripped = line.strip()
        if not stripped:
            doc.add_paragraph()
            continue

        p = doc.add_paragraph()
        if stripped.isupper() and len(stripped) < 80:
            p.paragraph_format.space_before = Pt(8)
            p.paragraph_format.space_after = Pt(4)
            run = p.add_run(stripped)
            run.bold = True
            run.font.size = Pt(12)
            run.font.color.rgb = RGBColor(16, 42, 67)
        elif stripped.startswith(("1.", "2.", "3.", "4.", "5.", "6.", "7.", "8.", "9.")):
            p.paragraph_format.left_indent = Inches(0.25)
            p.paragraph_format.space_after = Pt(4)
            run = p.add_run(stripped)
            run.font.size = Pt(11)
        else:
            p.paragraph_format.space_after = Pt(4)
            p.paragraph_format.line_spacing = 1.15
            run = p.add_run(stripped)
            run.font.size = Pt(11)

    # Footer note
    footer = doc.sections[0].footer
    footer_para = footer.paragraphs[0]
    footer_para.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    footer_run = footer_para.add_run("LegalAI Draft | Verify local stamp duty & registration requirements")
    footer_run.font.size = Pt(8)
    footer_run.font.color.rgb = RGBColor(159, 179, 200)

    file_path = os.path.join(OUTPUT_DIR, f"{document_id}.docx")
    doc.save(file_path)
    return file_path
