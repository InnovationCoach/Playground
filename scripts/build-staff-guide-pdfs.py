#!/usr/bin/env python3
"""
Build one fillable PDF testing guide per dashboard from
docs/staff-testing-guide/steps.json and the screenshots in shots/.

Each step gets its screenshot, instructions, Pass / Issue / Blocked / Skip
buttons and a typed notes box, so staff can fill it in on screen (Acrobat
Reader, Preview) and send it back, or print it and write by hand.

Usage:  python3 scripts/build-staff-guide-pdfs.py   (needs reportlab + pillow)
"""
import json
import re
from pathlib import Path

from PIL import Image as PILImage
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (BaseDocTemplate, Flowable, Frame, Image, KeepTogether, PageBreak,
                                PageTemplate, Paragraph, Spacer, Table, TableStyle)

ROOT = Path(__file__).resolve().parent.parent / 'docs' / 'staff-testing-guide'
OUT = ROOT / 'pdf'
SITE = 'https://dnd-master-73449.web.app'

PURPLE = colors.HexColor('#8250A0')
PURPLE_TINT = colors.HexColor('#F0E8F7')
LIME = colors.HexColor('#96D700')
LIME_INK = colors.HexColor('#557A00')
LIME_TINT = colors.HexColor('#F1FAD6')
AMBER = colors.HexColor('#A15C00')
AMBER_TINT = colors.HexColor('#FFF3DC')
NAVY = colors.HexColor('#003C69')
INK = colors.HexColor('#17324D')
MUTED = colors.HexColor('#4A5D70')
LINE = colors.HexColor('#D9DAD3')
FIELD_BG = colors.HexColor('#FAFAFD')

PAGE_W, PAGE_H = A4
MARGIN = 18 * mm
CONTENT_W = PAGE_W - 2 * MARGIN

FILE_NAMES = {'student': 'Student', 'primary': 'Junior-Explorers', 'coach': 'Coach', 'admin': 'Admin', 'parent': 'Parent'}
VERDICTS = [('pass', 'Pass'), ('issue', 'Issue'), ('blocked', 'Blocked'), ('skip', 'Skip')]
RATING = ['Very hard', 'Hard', 'OK', 'Easy', 'Very easy']

ST = {
    'eyebrow': ParagraphStyle('eyebrow', fontName='Helvetica-Bold', fontSize=8.5, leading=11, textColor=PURPLE, spaceAfter=3),
    'h1': ParagraphStyle('h1', fontName='Helvetica-Bold', fontSize=28, leading=33, textColor=NAVY, spaceAfter=6),
    'h2': ParagraphStyle('h2', fontName='Helvetica-Bold', fontSize=16, leading=20, textColor=NAVY, spaceAfter=6),
    'h3': ParagraphStyle('h3', fontName='Helvetica-Bold', fontSize=12, leading=15, textColor=NAVY, spaceBefore=6, spaceAfter=4),
    'lede': ParagraphStyle('lede', fontName='Helvetica', fontSize=11.5, leading=16, textColor=MUTED, spaceAfter=10),
    'body': ParagraphStyle('body', fontName='Helvetica', fontSize=10, leading=14, textColor=INK, alignment=TA_LEFT),
    'small': ParagraphStyle('small', fontName='Helvetica', fontSize=8.5, leading=11.5, textColor=MUTED),
    'boxhead_ok': ParagraphStyle('bok', fontName='Helvetica-Bold', fontSize=7.5, leading=10, textColor=LIME_INK),
    'boxhead_watch': ParagraphStyle('bw', fontName='Helvetica-Bold', fontSize=7.5, leading=10, textColor=AMBER),
}


def clean(html):
    """Web-guide markup to ReportLab markup, and glyphs Helvetica lacks to words."""
    s = re.sub(r'<span class="mono">(.*?)</span>', r'<font face="Courier">\1</font>', html)
    return (s.replace('ไทย', 'Thai').replace('中文', 'Chinese').replace('🔊 ', '')
             .replace('→', '-&gt;'))


class Radios(Flowable):
    """A labelled row of exclusive radio buttons (one AcroForm group)."""

    def __init__(self, name, label, options, width=CONTENT_W):
        super().__init__()
        self.name, self.label, self.options, self.width, self.height = name, label, options, width, 16

    def draw(self):
        c = self.canv
        c.setFont('Helvetica-Bold', 9.5)
        c.setFillColor(INK)
        c.drawString(0, 4, self.label)
        x = c.stringWidth(self.label, 'Helvetica-Bold', 9.5) + 10
        for value, text in self.options:
            c.acroForm.radio(name=self.name, value=value, selected=False, x=x, y=0, size=13,
                             buttonStyle='circle', borderColor=PURPLE, fillColor=colors.white,
                             textColor=PURPLE, forceBorder=True, relative=True, tooltip=f'{self.label} {text}')
            c.setFont('Helvetica', 9.5)
            c.setFillColor(INK)
            c.drawString(x + 17, 4, text)
            x += 17 + c.stringWidth(text, 'Helvetica', 9.5) + 16


class TextBox(Flowable):
    """A typed-in field with a label above it; multiline when tall."""

    def __init__(self, name, label, height=14, width=CONTENT_W):
        super().__init__()
        self.name, self.label, self.box_h, self.width = name, label, height, width
        self.height = height + (13 if label else 0)

    def draw(self):
        c = self.canv
        if self.label:
            c.setFont('Helvetica-Bold', 8.5)
            c.setFillColor(MUTED)
            c.drawString(0, self.box_h + 4, self.label)
        multi = self.box_h > 20
        c.acroForm.textfield(name=self.name, x=0, y=0, width=self.width, height=self.box_h,
                             borderColor=LINE, fillColor=FIELD_BG, textColor=INK, fontName='Helvetica',
                             fontSize=10 if multi else 10.5, borderWidth=1, forceBorder=True, relative=True,
                             fieldFlags='multiline' if multi else '', tooltip=self.label or self.name)
        if multi:  # faint writing lines for anyone who prints it
            c.setStrokeColor(colors.HexColor('#ECEDE8'))
            c.setLineWidth(0.5)
            y = self.box_h - 16
            while y > 4:
                c.line(6, y, self.width - 6, y)
                y -= 16


def tinted_box(head, text, head_style, bg):
    t = Table([[Paragraph(head, head_style)], [Paragraph(text, ST['body'])]], colWidths=[CONTENT_W])
    t.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), bg), ('LEFTPADDING', (0, 0), (-1, -1), 9),
                           ('RIGHTPADDING', (0, 0), (-1, -1), 9), ('TOPPADDING', (0, 0), (-1, 0), 7),
                           ('BOTTOMPADDING', (0, -1), (-1, -1), 8), ('TOPPADDING', (0, 1), (-1, 1), 1),
                           ('BOTTOMPADDING', (0, 0), (-1, 0), 0)]))
    return t


def shot(name, width):
    path = ROOT / 'shots' / f'{name}.jpg'
    w, h = PILImage.open(path).size
    img = Image(str(path), width=width, height=width * h / w)
    frame = Table([[img]], colWidths=[width])
    frame.setStyle(TableStyle([('BOX', (0, 0), (-1, -1), 0.75, LINE), ('LEFTPADDING', (0, 0), (-1, -1), 0),
                               ('RIGHTPADDING', (0, 0), (-1, -1), 0), ('TOPPADDING', (0, 0), (-1, -1), 0),
                               ('BOTTOMPADDING', (0, 0), (-1, -1), 0)]))
    return frame


def numbered(items):
    rows = [[Paragraph(f'<font color="#8250A0"><b>{i}.</b></font>', ST['body']), Paragraph(clean(t), ST['body'])]
            for i, t in enumerate(items, 1)]
    t = Table(rows, colWidths=[7 * mm, CONTENT_W - 7 * mm])
    t.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP'), ('LEFTPADDING', (0, 0), (-1, -1), 0),
                           ('RIGHTPADDING', (0, 0), (-1, -1), 0), ('TOPPADDING', (0, 0), (-1, -1), 1.5),
                           ('BOTTOMPADDING', (0, 0), (-1, -1), 1.5)]))
    return t


def cover(d):
    story = [Spacer(1, 16 * mm),
             Paragraph('WELEARN GROWTH HUB · STAFF TESTING · OCTOBER 2026', ST['eyebrow']),
             Paragraph(f'{d["name"]} dashboard', ST['h1']),
             Paragraph(f'{d["sub"]}. Work through each step on the real platform, compare what you see with the '
                       f'screenshot, and record what happened. Fill this PDF in on screen, save it, and send it back '
                       f'to the test lead. Or print it and write by hand.', ST['lede'])]

    info = [[Paragraph('<b>Platform</b>', ST['body']), Paragraph(f'<link href="{SITE}" color="#8250A0">{SITE}</link>', ST['body'])],
            [Paragraph('<b>Sign in as</b>', ST['body']), Paragraph(f'<font face="Courier">{d["account"]}</font> ({d["who"]})', ST['body'])],
            [Paragraph('<b>Password</b>', ST['body']), Paragraph('The test lead gives you the shared test password.', ST['body'])],
            [Paragraph('<b>Steps</b>', ST['body']), Paragraph(f'{len(d["steps"])} steps, about {max(15, len(d["steps"]) * 4)} minutes', ST['body'])]]
    if d['id'] == 'admin':
        info.insert(2, [Paragraph('<b>Also</b>', ST['body']), Paragraph('<font face="Courier">supervisor.test@school.edu</font> for the last step', ST['body'])])
    t = Table(info, colWidths=[30 * mm, CONTENT_W - 30 * mm])
    t.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), PURPLE_TINT), ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                           ('LEFTPADDING', (0, 0), (-1, -1), 9), ('TOPPADDING', (0, 0), (-1, -1), 5),
                           ('BOTTOMPADDING', (0, 0), (-1, -1), 5), ('LINEBELOW', (0, 0), (-1, -2), 0.5, colors.white)]))
    story += [t, Spacer(1, 8 * mm), Paragraph('Your details', ST['h2'])]

    half = (CONTENT_W - 6 * mm) / 2
    fields = Table([[TextBox('tester_name', 'Your name', width=half), TextBox('tester_team', 'Team or role', width=half)],
                    [TextBox('tester_device', 'Device (laptop, tablet, phone)', width=half), TextBox('tester_browser', 'Browser', width=half)],
                    [TextBox('tester_date', 'Date tested', width=half), '']],
                   colWidths=[half + 6 * mm, half])
    fields.setStyle(TableStyle([('LEFTPADDING', (0, 0), (-1, -1), 0), ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                                ('BOTTOMPADDING', (0, 0), (-1, -1), 7)]))
    story += [fields, Spacer(1, 5 * mm), Paragraph('Before you start', ST['h2'])]
    rules = ['Do not change the password on any test account. Others share it.',
             'Do not suspend, unlink or delete accounts unless a step tells you to.',
             'Use only made-up names and test emails in forms, never real learner data.',
             'If a screen looks different from the screenshot, that is useful. Mark it and describe the difference.',
             'Use a private or incognito window so you stay signed in to one account at a time.']
    story.append(numbered(rules))
    story += [Spacer(1, 5 * mm), Paragraph('How to mark each step', ST['h2'])]
    legend = Table([[Paragraph('<b>Pass</b>', ST['body']), Paragraph('It worked and matched “You should see”.', ST['body'])],
                    [Paragraph('<b>Issue</b>', ST['body']), Paragraph('Something was wrong, slow, confusing or different. Describe it.', ST['body'])],
                    [Paragraph('<b>Blocked</b>', ST['body']), Paragraph('You could not do the step at all, for example an error or a missing button.', ST['body'])],
                    [Paragraph('<b>Skip</b>', ST['body']), Paragraph('You chose not to test it, or it needs another tester first.', ST['body'])]],
                   colWidths=[22 * mm, CONTENT_W - 22 * mm])
    legend.setStyle(TableStyle([('LEFTPADDING', (0, 0), (-1, -1), 0), ('TOPPADDING', (0, 0), (-1, -1), 2), ('BOTTOMPADDING', (0, 0), (-1, -1), 2)]))
    story += [legend, PageBreak()]
    return story


def step_pages(d):
    story = []
    n = len(d['steps'])
    for i, s in enumerate(d['steps'], 1):
        key = f's{i:02d}'
        block = [Paragraph(f'{d["name"].upper()} · STEP {i} OF {n}', ST['eyebrow']), Paragraph(s['t'], ST['h2'])]
        main, extra = s['shots'][0], s['shots'][1:]
        block += [shot(main, CONTENT_W if not extra else CONTENT_W * 0.86), Spacer(1, 2 * mm)]
        if extra:
            tw = (CONTENT_W - 4 * mm * (len(extra) - 1)) / max(len(extra), 2)
            row = Table([[shot(x, tw) for x in extra]], colWidths=[tw + 4 * mm] * len(extra))
            row.setStyle(TableStyle([('LEFTPADDING', (0, 0), (-1, -1), 0), ('RIGHTPADDING', (0, 0), (-1, -1), 0)]))
            block += [row, Spacer(1, 1 * mm)]
        block += [Paragraph('Real screenshot from the platform. Yours may show different data.', ST['small']), Spacer(1, 3 * mm)]
        story += block
        story += [Paragraph('What to do', ST['h3']), numbered(s['do']), Spacer(1, 3 * mm),
                  tinted_box('YOU SHOULD SEE', clean(s['expect']), ST['boxhead_ok'], LIME_TINT)]
        if s.get('watch'):
            story += [Spacer(1, 2 * mm), tinted_box('LOOK CLOSELY', clean(s['watch']), ST['boxhead_watch'], AMBER_TINT)]
        story += [Spacer(1, 4 * mm),
                  KeepTogether([Radios(f'{key}_result', 'Result:', VERDICTS), Spacer(1, 3 * mm),
                                TextBox(f'{key}_notes', 'What happened? What did you click, expect and see instead?', height=24 * mm)]),
                  PageBreak()]
    return story


def wrapup(d):
    return [Paragraph('LAST PAGE', ST['eyebrow']),
            Paragraph(f'Wrap-up: the {d["name"]} dashboard overall', ST['h1']),
            Paragraph('A few sentences is plenty. These answers help us decide what to fix first.', ST['lede']),
            Radios('ease_rating', 'How easy was it to use?', [(str(i + 1), f'{i + 1} {t}') for i, t in enumerate(RATING)]),
            Spacer(1, 7 * mm),
            TextBox('worked_well', 'What worked well?', height=30 * mm), Spacer(1, 5 * mm),
            TextBox('confusing', 'What was confusing, slow or missing?', height=36 * mm), Spacer(1, 5 * mm),
            TextBox('fix_first', 'If we fix one thing first, what should it be?', height=24 * mm), Spacer(1, 5 * mm),
            TextBox('anything_else', 'Anything else?', height=24 * mm), Spacer(1, 7 * mm),
            tinted_box('WHEN YOU HAVE FINISHED',
                       'Save this PDF (File &gt; Save), keep the file name, and send it to the test lead. '
                       'If you printed it, scan or photograph each page.', ST['boxhead_ok'], LIME_TINT)]


def build(d):
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f'Growth-Hub-Testing-{FILE_NAMES[d["id"]]}.pdf'

    def chrome(c, doc):
        c.saveState()
        c.setFillColor(PURPLE)
        c.rect(0, PAGE_H - 7 * mm, PAGE_W, 7 * mm, stroke=0, fill=1)
        c.setFillColor(LIME)
        c.rect(0, PAGE_H - 7 * mm, 40 * mm, 7 * mm, stroke=0, fill=1)
        c.setFillColor(NAVY)
        c.setFont('Helvetica-Bold', 8)
        c.drawString(MARGIN, PAGE_H - 4.8 * mm, 'GROWTH HUB')
        c.setFillColor(colors.white)
        c.drawRightString(PAGE_W - MARGIN, PAGE_H - 4.8 * mm, f'{d["name"].upper()} DASHBOARD · STAFF TESTING')
        c.setFillColor(MUTED)
        c.setFont('Helvetica', 8)
        c.drawString(MARGIN, 10 * mm, f'Sign in as {d["account"]}')
        c.drawRightString(PAGE_W - MARGIN, 10 * mm, f'Page {doc.page}')
        c.restoreState()

    doc = BaseDocTemplate(str(path), pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN, topMargin=14 * mm,
                          bottomMargin=16 * mm, title=f'Growth Hub testing guide: {d["name"]} dashboard',
                          author='WeLearn', subject='Staff testing guide with feedback form')
    frame = Frame(MARGIN, 16 * mm, CONTENT_W, PAGE_H - 30 * mm, id='f', leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    doc.addPageTemplates([PageTemplate(id='p', frames=[frame], onPage=chrome)])
    doc.build(cover(d) + step_pages(d) + wrapup(d))
    return path


if __name__ == '__main__':
    for dash in json.loads((ROOT / 'steps.json').read_text()):
        p = build(dash)
        print(f'{p.relative_to(ROOT.parent.parent)}  {p.stat().st_size // 1024} KB')
