#!/usr/bin/env python3
"""Generate STARSPIN sales guide PDFs from markdown (EN + RU)."""

from __future__ import annotations

import re
import sys
from pathlib import Path

from fpdf import FPDF

ROOT = Path(__file__).resolve().parents[1]
SALES_DIR = ROOT / "docs" / "sales"
FONT_REG = Path(r"C:\Windows\Fonts\arial.ttf")
FONT_BOLD = Path(r"C:\Windows\Fonts\arialbd.ttf")


class SalesPdf(FPDF):
    def __init__(self, title: str) -> None:
        super().__init__(format="A4")
        self.set_auto_page_break(auto=True, margin=15)
        self._doc_title = title
        self.add_font("Arial", "", str(FONT_REG))
        self.add_font("Arial", "B", str(FONT_BOLD))
        self.set_font("Arial", size=10)

    def header(self) -> None:
        self.set_font("Arial", "B", 9)
        self.set_text_color(100, 100, 100)
        self.cell(0, 8, self._doc_title, align="R", new_x="LMARGIN", new_y="NEXT")
        self.set_text_color(0, 0, 0)
        self.ln(2)

    def footer(self) -> None:
        self.set_y(-12)
        self.set_font("Arial", "", 8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 8, f"STARSPIN · starspin.cc · page {self.page_no()}", align="C")

    def write_md_line(self, line: str) -> None:
        line = line.rstrip()
        if not line.strip():
            self.ln(3)
            return

        if line.startswith("# "):
            self.ln(4)
            self.set_font("Arial", "B", 18)
            self.multi_cell(0, 9, strip_md(line[2:]))
            self.ln(2)
            self.set_font("Arial", "", 10)
            return

        if line.startswith("## "):
            self.ln(5)
            self.set_font("Arial", "B", 13)
            self.set_fill_color(245, 224, 142)
            self.multi_cell(0, 8, strip_md(line[3:]), fill=True)
            self.ln(2)
            self.set_font("Arial", "", 10)
            return

        if line.startswith("### "):
            self.ln(3)
            self.set_font("Arial", "B", 11)
            self.multi_cell(0, 7, strip_md(line[4:]))
            self.ln(1)
            self.set_font("Arial", "", 10)
            return

        if line.startswith("---"):
            self.ln(2)
            self.set_draw_color(200, 200, 200)
            y = self.get_y()
            self.line(10, y, 200, y)
            self.ln(4)
            return

        if line.startswith("|") and "|" in line[1:]:
            return  # tables handled separately

        bullet = line.startswith("- ") or line.startswith("* ")
        if re.match(r"^\d+\.\s", line):
            bullet = True

        text = line
        if bullet:
            text = re.sub(r"^[-*]\s+", "• ", line)
            text = re.sub(r"^\d+\.\s+", "• ", text)
            self.set_x(14)

        self.write_rich(text, indent=bullet)
        self.ln(5 if bullet else 4)

    def write_rich(self, text: str, indent: bool = False) -> None:
        x0 = 14 if indent else 10
        self.set_x(x0)
        width = 196 - x0
        parts = re.split(r"(\*\*.*?\*\*)", text)
        if len(parts) == 1:
            self.set_font("Arial", "", 10)
            self.multi_cell(width, 5, strip_md(text))
            return

        # Fallback: strip markdown for complex inline
        self.set_font("Arial", "", 10)
        self.multi_cell(width, 5, strip_md(text))


def strip_md(text: str) -> str:
    text = re.sub(r"\*\*(.*?)\*\*", r"\1", text)
    text = re.sub(r"`(.*?)`", r"\1", text)
    text = re.sub(r"\*(.*?)\*", r"\1", text)
    return text


def parse_table_rows(lines: list[str], start: int) -> tuple[list[list[str]], int]:
    rows: list[list[str]] = []
    i = start
    while i < len(lines):
        line = lines[i].strip()
        if not line.startswith("|"):
            break
        if re.match(r"^\|[-:\s|]+\|$", line):
            i += 1
            continue
        cells = [strip_md(c.strip()) for c in line.strip("|").split("|")]
        rows.append(cells)
        i += 1
    return rows, i


def render_table(pdf: SalesPdf, rows: list[list[str]]) -> None:
    if not rows:
        return
    col_count = max(len(r) for r in rows)
    page_w = 190
    col_w = page_w / col_count
    pdf.ln(2)
    pdf.set_font("Arial", "B", 9)
    header = rows[0]
    for cell in header:
        pdf.cell(col_w, 7, cell[:40], border=1, fill=True)
    pdf.ln()
    pdf.set_font("Arial", "", 9)
    for row in rows[1:]:
        while len(row) < col_count:
            row.append("")
        row_h = 7
        for cell in row:
            # rough wrap: taller rows for long cells
            if len(cell) > 45:
                row_h = 12
        x_start = pdf.get_x()
        y_start = pdf.get_y()
        if y_start > 270:
            pdf.add_page()
            y_start = pdf.get_y()
        for idx, cell in enumerate(row):
            pdf.set_xy(x_start + idx * col_w, y_start)
            pdf.multi_cell(col_w, 5, cell[:120], border=1, align="L")
        pdf.set_xy(x_start, y_start + row_h)
    pdf.ln(4)


def md_to_pdf(md_path: Path, pdf_path: Path, title: str) -> None:
    lines = md_path.read_text(encoding="utf-8").splitlines()
    pdf = SalesPdf(title)
    pdf.add_page()

    i = 0
    while i < len(lines):
        line = lines[i]
        if line.strip().startswith("|"):
            rows, i = parse_table_rows(lines, i)
            render_table(pdf, rows)
            continue
        pdf.write_md_line(line)
        i += 1

    pdf.output(str(pdf_path))
    print(f"Created {pdf_path}")


def main() -> int:
    if not FONT_REG.exists():
        print("Arial font not found — install or adjust FONT_REG path", file=sys.stderr)
        return 1

    pairs = [
        (SALES_DIR / "STARSPIN_Sales_Guide_EN.md", SALES_DIR / "STARSPIN_Sales_Guide_EN.pdf", "STARSPIN Sales Guide"),
        (SALES_DIR / "STARSPIN_Sales_Guide_RU.md", SALES_DIR / "STARSPIN_Sales_Guide_RU.pdf", "STARSPIN — Руководство продаж"),
    ]
    for md, pdf, title in pairs:
        if not md.exists():
            print(f"Missing {md}", file=sys.stderr)
            return 1
        md_to_pdf(md, pdf, title)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
