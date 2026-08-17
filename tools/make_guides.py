# -*- coding: utf-8 -*-
"""
Generate the printed guides in Guides/ from their markdown sources.

    python tools\\make_guides.py

The version is read from APP_VER in index.html, so the filenames always match
what tests.html checks for. Bump the version, re-run this, and the release gate
goes green — there is no second place to keep in step.

Requires: pip install --user reportlab
"""

import io, os, re, sys, datetime

try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.lib import colors
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib.enums import TA_LEFT
    from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                    TableStyle, HRFlowable, KeepTogether)
except ImportError:
    sys.exit("reportlab is not installed.  Run:  python -m pip install --user reportlab")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "Guides")

# A4 cards live in Training/ and are rendered from their SVG sources.
CARDS = [
    "Quick_Card_Handover",
    "Quick_Card_Photos",
]

GUIDES = [
    "01_Setup and User Guide",
    "02_Iteration Guide",
    "03_Handover and Version Control Protocol",
    "05_Release Protocol",
]

NAVY   = colors.HexColor("#123A5F")
INK    = colors.HexColor("#14202B")
INK2   = colors.HexColor("#54626F")
RULE   = colors.HexColor("#DDE5EC")
FILL   = colors.HexColor("#E8F1FA")
AMBER  = colors.HexColor("#9A6410")
AMBERF = colors.HexColor("#FDF6E3")
CODEBG = colors.HexColor("#F4F6F8")


def app_version():
    src = io.open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()
    m = re.search(r"var APP_VER\s*=\s*'([^']+)'", src)
    if not m:
        sys.exit("could not read APP_VER from index.html")
    return m.group(1)


# ---------- inline markdown -> reportlab's mini-HTML ----------

def inline(t):
    t = t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    t = re.sub(r"`([^`]+)`",
               r'<font face="Courier" size="9" backColor="#F4F6F8">\1</font>', t)
    t = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", t)
    t = re.sub(r"(?<!\*)\*([^*]+)\*(?!\*)", r"<i>\1</i>", t)
    t = re.sub(r"~~([^~]+)~~", r"<strike>\1</strike>", t)
    t = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", t)      # link text only
    return t


S = {
  "h1":   ParagraphStyle("h1", fontName="Helvetica-Bold", fontSize=19, leading=23,
                         textColor=NAVY, spaceAfter=2),
  "h2":   ParagraphStyle("h2", fontName="Helvetica-Bold", fontSize=13.5, leading=17,
                         textColor=NAVY, spaceBefore=14, spaceAfter=5),
  "h3":   ParagraphStyle("h3", fontName="Helvetica-Bold", fontSize=11, leading=14,
                         textColor=INK, spaceBefore=10, spaceAfter=3),
  "body": ParagraphStyle("body", fontName="Helvetica", fontSize=9.5, leading=13.5,
                         textColor=INK, spaceAfter=6, alignment=TA_LEFT),
  "li":   ParagraphStyle("li", fontName="Helvetica", fontSize=9.5, leading=13.5,
                         textColor=INK, leftIndent=12, bulletIndent=2, spaceAfter=2),
  "quote":ParagraphStyle("quote", fontName="Helvetica", fontSize=9.5, leading=13.5,
                         textColor=INK, leftIndent=8, rightIndent=6,
                         spaceBefore=3, spaceAfter=3),
  "code": ParagraphStyle("code", fontName="Courier", fontSize=8, leading=10.5,
                         textColor=INK, leftIndent=6),
  "th":   ParagraphStyle("th", fontName="Helvetica-Bold", fontSize=8.5, leading=11,
                         textColor=NAVY),
  "td":   ParagraphStyle("td", fontName="Helvetica", fontSize=8.5, leading=11,
                         textColor=INK),
  "sub":  ParagraphStyle("sub", fontName="Helvetica", fontSize=9, leading=12,
                         textColor=INK2, spaceAfter=10),
}


def table_flowable(rows, width):
    head, body = rows[0], rows[1:]
    data = [[Paragraph(inline(c), S["th"]) for c in head]]
    for r in body:
        data.append([Paragraph(inline(c), S["td"]) for c in r])
    cols = max(len(r) for r in data)
    data = [r + [Paragraph("", S["td"])] * (cols - len(r)) for r in data]
    t = Table(data, colWidths=[width / cols] * cols, repeatRows=1, hAlign="LEFT")
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), FILL),
        ("LINEBELOW", (0, 0), (-1, 0), 0.8, NAVY),
        ("LINEBELOW", (0, 1), (-1, -2), 0.3, RULE),
        ("BOX", (0, 0), (-1, -1), 0.5, RULE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    return t


def boxed(flows, fill, line, width):
    t = Table([[flows]], colWidths=[width], hAlign="LEFT")
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), fill),
        ("LINEBEFORE", (0, 0), (0, -1), 2.2, line),
        ("BOX", (0, 0), (-1, -1), 0.3, RULE),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return t


def parse(md, width):
    out, i = [], 0
    lines = md.split("\n")
    while i < len(lines):
        ln = lines[i]

        # fenced code
        if ln.strip().startswith("```"):
            i += 1
            buf = []
            while i < len(lines) and not lines[i].strip().startswith("```"):
                buf.append(lines[i]); i += 1
            i += 1
            body = "<br/>".join(
                l.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                 .replace(" ", "&nbsp;") for l in buf)
            out.append(boxed([Paragraph(body, S["code"])], CODEBG, RULE, width))
            out.append(Spacer(1, 6))
            continue

        # blockquote / callout
        if ln.startswith(">"):
            buf = []
            while i < len(lines) and lines[i].startswith(">"):
                buf.append(lines[i].lstrip(">").strip()); i += 1
            paras, cur = [], []
            for b in buf:
                if b == "":
                    if cur: paras.append(" ".join(cur)); cur = []
                else:
                    cur.append(b)
            if cur: paras.append(" ".join(cur))
            flows = [Paragraph(inline(p), S["quote"]) for p in paras]
            out.append(boxed(flows, AMBERF, AMBER, width))
            out.append(Spacer(1, 7))
            continue

        # table
        if ln.strip().startswith("|") and i + 1 < len(lines) and \
           re.match(r"^\s*\|[\s:\-|]+\|\s*$", lines[i + 1]):
            rows = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                cells = [c.strip() for c in lines[i].strip().strip("|").split("|")]
                if not re.match(r"^[\s:\-]+$", "".join(cells)):
                    rows.append(cells)
                i += 1
            if rows:
                out.append(table_flowable(rows, width))
                out.append(Spacer(1, 8))
            continue

        # headings
        m = re.match(r"^(#{1,3})\s+(.*)$", ln)
        if m:
            lvl = len(m.group(1))
            out.append(Paragraph(inline(m.group(2)), S["h%d" % lvl]))
            if lvl == 2:
                out.append(HRFlowable(width="100%", thickness=0.4, color=RULE,
                                      spaceBefore=1, spaceAfter=6))
            i += 1
            continue

        # horizontal rule
        if re.match(r"^-{3,}$", ln.strip()):
            out.append(Spacer(1, 4))
            i += 1
            continue

        # list item (bullet, numbered, or checkbox)
        m = re.match(r"^(\s*)([-*]|\d+\.)\s+(.*)$", ln)
        if m:
            indent = len(m.group(1))
            txt = m.group(3)
            marker = "\u2022"
            cb = re.match(r"^\[([ xX])\]\s*(.*)$", txt)
            if cb:
                marker = "\u2611" if cb.group(1).lower() == "x" else "\u2610"
                txt = cb.group(2)
            elif re.match(r"^\d+\.$", m.group(2)):
                marker = m.group(2)
            st = ParagraphStyle("li%d" % indent, parent=S["li"],
                                leftIndent=12 + indent * 10,
                                bulletIndent=2 + indent * 10)
            out.append(Paragraph(inline(txt), st, bulletText=marker))
            i += 1
            continue

        # blank
        if ln.strip() == "":
            i += 1
            continue

        # paragraph — join continuation lines
        buf = [ln]
        i += 1
        while i < len(lines) and lines[i].strip() and \
              not re.match(r"^(#{1,3}\s|>|\||```|-{3,}$|\s*([-*]|\d+\.)\s)", lines[i]):
            buf.append(lines[i]); i += 1
        out.append(Paragraph(inline(" ".join(b.strip() for b in buf)), S["body"]))
    return out


def build(name, version):
    src = os.path.join(ROOT, name + ".md")
    dst = os.path.join(OUT, "%s_v%s.pdf" % (name, version))
    md = io.open(src, encoding="utf-8").read()

    margin = 18 * mm
    width = A4[0] - margin * 2

    def furniture(canv, doc):
        canv.saveState()
        canv.setFont("Helvetica", 7.5)
        canv.setFillColor(INK2)
        canv.drawString(margin, 12 * mm,
                        "Dryspace Solutions  ·  %s  ·  v%s" % (name, version))
        canv.drawRightString(A4[0] - margin, 12 * mm, "Page %d" % doc.page)
        canv.setStrokeColor(RULE)
        canv.setLineWidth(0.4)
        canv.line(margin, 15 * mm, A4[0] - margin, 15 * mm)
        canv.restoreState()

    doc = SimpleDocTemplate(dst, pagesize=A4,
                            leftMargin=margin, rightMargin=margin,
                            topMargin=margin, bottomMargin=22 * mm,
                            title=name, author="Dryspace Solutions")

    story = parse(md, width)
    story.insert(0, Spacer(1, 2))
    story.insert(1, Paragraph(
        "Generated from %s.md on %s — do not edit this PDF."
        % (name, datetime.date.today().strftime("%d %B %Y")), S["sub"]))
    doc.build(story, onFirstPage=furniture, onLaterPages=furniture)
    return dst, os.path.getsize(dst)


def build_card(name, version):
    """Render an A4 card from its SVG source. The SVG is the editable original;
       this only ever produces the printable copy."""
    from svglib.svglib import svg2rlg
    from reportlab.graphics import renderPDF
    src = os.path.join(ROOT, "Training", name + ".svg")
    dst = os.path.join(ROOT, "Training", "%s_v%s.pdf" % (name, version))
    drawing = svg2rlg(src)
    renderPDF.drawToFile(drawing, dst)
    return dst, os.path.getsize(dst)


if __name__ == "__main__":
    v = app_version()
    if not os.path.isdir(OUT):
        os.makedirs(OUT)
    print("APP_VER %s\n" % v)
    for g in GUIDES:
        try:
            path, size = build(g, v)
            print("  %-46s %6.1f KB" % (os.path.basename(path), size / 1024.0))
        except Exception as e:
            print("  %-46s FAILED: %s" % (g, e))
            raise

    for c in CARDS:
        try:
            path, size = build_card(c, v)
            print("  %-46s %6.1f KB" % (os.path.basename(path), size / 1024.0))
        except ImportError:
            print("  %-46s SKIPPED — pip install --user svglib" % c)
        except Exception as e:
            print("  %-46s FAILED: %s" % (c, e))
            raise

    print("\nStale PDFs from earlier versions are not removed automatically —")
    print("delete them so nobody reads the wrong one.")
