"""Builds templates/spare-key-inventory-template.xlsx: a spreadsheet version of
the Spare Key inventory, for people who would rather fill in a spreadsheet.
Run: python3 scripts/excel_template.py
"""
from pathlib import Path
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.worksheet.table import Table, TableStyleInfo
from openpyxl.formatting.rule import FormulaRule, CellIsRule

OUT = Path(__file__).resolve().parent.parent / 'templates' / 'spare-key-inventory-template.xlsx'
SANS, MONO = 'Arial', 'Consolas'
INK, MUTED, GREEN, GREEN_BG, LINE, INPUT_BG = '171717', '5C5C5C', '00782A', 'E6F7EA', 'D9D9D9', 'FFFDF2'
RED, RED_BG, AMBER, AMBER_BG = 'B3121A', 'FFF0F0', '8A5300', 'FFF6E5'

thin = Side(style='thin', color=LINE)
under = Border(bottom=thin)
wrap = Alignment(wrap_text=True, vertical='top')

def f(size=10, bold=False, color=INK, mono=False, italic=False):
    return Font(name=MONO if mono else SANS, size=size, bold=bold, color=color, italic=italic)

def fill(c):
    return PatternFill('solid', start_color=c, end_color=c)

def title(ws, text, sub):
    from openpyxl.cell.rich_text import CellRichText, TextBlock
    from openpyxl.cell.text import InlineFont
    ws['B2'] = CellRichText(TextBlock(InlineFont(rFont=MONO, sz=12, color=INK), 'spare'), TextBlock(InlineFont(rFont=MONO, sz=12, color=GREEN, b=True), 'key'))
    ws['B3'] = text; ws['B3'].font = f(22, bold=True)
    ws['B4'] = sub; ws['B4'].font = f(10, color=MUTED)
    ws.row_dimensions[3].height = 34
    ws.sheet_view.showGridLines = False

wb = Workbook()

# ---------------- Start here ----------------
st = wb.active
st.title = 'Start here'
title(st, 'Website continuity plan', 'What the website and email depend on, who pays for what, and who can manage it.')
st.column_dimensions['A'].width = 3
st.column_dimensions['B'].width = 30
st.column_dimensions['C'].width = 60

row = 6
st.cell(row, 2, 'AT A GLANCE').font = f(8, bold=True, color=GREEN, mono=True)
glance = [
    ('Services listed', '=COUNTA(Services[Service])', None),
    ('Serious', '=COUNTIF(Services[Risk],"Serious*")', RED),
    ('Fix soon', '=COUNTIF(Services[Risk],"Fix soon*")', AMBER),
    ('Domains renewing within 60 days', '=COUNTIFS(Domains[Days left],"<=60",Domains[Days left],">=0")', AMBER),
]
for label, formula, col in glance:
    row += 1
    st.cell(row, 2, label).font = f(10)
    c = st.cell(row, 3, formula)
    c.font = f(14, bold=True, color=col or INK)
    c.alignment = Alignment(horizontal='left')
    st.row_dimensions[row].height = 22

row += 2
st.cell(row, 2, 'HOW TO USE THIS').font = f(8, bold=True, color=GREEN, mono=True)
notes = [
    'Fill in the cream cells. Grey italic rows are examples: overwrite or delete them.',
    'List every service on the Services tab. Whose name it is in, and who pays, matter most.',
    'The Risks column on the Services tab fills itself in. The counts below add them up.',
    'There are no passwords in this spreadsheet, on purpose. Say where they are kept instead.',
    'Prefer it done for you? sparekey.dev looks up the public details and writes a Word document. It stores nothing.',
]
for n in notes:
    row += 1
    st.cell(row, 2, '•').font = f(10, color=GREEN, bold=True)
    st.cell(row, 2).alignment = Alignment(horizontal='right', vertical='top')
    st.cell(row, 3, n).font = f(10)
    st.cell(row, 3).alignment = wrap

row += 2
st.cell(row, 2, 'THE PEOPLE').font = f(8, bold=True, color=GREEN, mono=True)
fields = [
    ('Organisation', 'Village Arts Trail'),
    ('Owner (name and email)', 'Anita Smith, anita@example.org'),
    ('Looks after the website', 'Sam Taylor, 07700 900000'),
    ('Emergency contact', 'Pat Jones (Sam’s executor), 07700 900001'),
    ('Technical helper', 'Someone who could take the work over'),
    ('Passwords are kept in', 'Shared 1Password vault “Village Arts”'),
    ('Backups are kept in', 'Weekly, in the charity’s Google Drive'),
    ('Last checked', None),
    ('Next review', None),
]
for label, ex in fields:
    row += 1
    st.cell(row, 2, label).font = f(10, bold=True)
    c = st.cell(row, 3, ex)
    c.font = f(10, color='8A8A8A', italic=True)
    c.fill = fill(INPUT_BG); c.border = under
    st.row_dimensions[row].height = 22
    if label == 'Last checked':
        c.value = '=TODAY()'; c.number_format = 'd mmmm yyyy'; c.font = f(10); c.alignment = Alignment(horizontal='left')
        last_checked = f'C{row}'
    if label == 'Next review':
        c.value = f'=EDATE({last_checked},12)'; c.number_format = 'd mmmm yyyy'; c.font = f(10); c.alignment = Alignment(horizontal='left')

row += 2
st.cell(row, 2, 'Template from sparekey.dev · free and open source · no passwords in this file').font = f(8, color=MUTED, mono=True)

# ---------------- Services ----------------
sv = wb.create_sheet('Services')
title(sv, 'Services', 'Everything the website and email depend on. One row per service.')
headers = ['Service', 'Type', 'Provider', 'What it does', 'Domain', 'In whose name', 'Paid by', 'Cost',
           'Renews', 'Auto-renews', 'Second admin', 'Notes', 'Risk']
widths = [26, 22, 18, 30, 22, 16, 16, 12, 14, 12, 13, 30, 44]
HR = 6
for i, (h, w) in enumerate(zip(headers, widths), start=2):
    sv.column_dimensions[chr(64 + i)].width = w
    c = sv.cell(HR, i, h)
    c.font = f(9, bold=True, color='FFFFFF', mono=True)
    c.fill = fill(INK)
    c.alignment = Alignment(vertical='center')
sv.row_dimensions[HR].height = 24
sv.column_dimensions['A'].width = 3

example = ['village-arts-trail.org registration', 'Domain registration', 'GoDaddy', 'The web address',
           'village-arts-trail.org', 'The builder', 'The builder', '£15 a year', None, 'Yes', 'No', 'Paid on Sam’s card']
N = 40
first, last = HR + 1, HR + N
for r in range(first, last + 1):
    for ci in range(2, 14):
        c = sv.cell(r, ci)
        c.fill = fill(INPUT_BG); c.border = under; c.font = f(10); c.alignment = Alignment(vertical='top', wrap_text=ci in (5, 13))
    sv.cell(r, 10).number_format = 'd mmm yyyy'
    # Risk: the same rules Spare Key uses, most serious first.
    sv.cell(r, 14).value = (
        f'=IF(B{r}="","",IF(L{r}="No","Serious: only one person can manage this. Add a second admin.",'
        f'IF(AND(G{r}<>"The client",H{r}<>"The client",H{r}<>""),"Fix soon: move the bill into the client’s name.",'
        f'IF(AND(J{r}<>"",J{r}-TODAY()<=60,K{r}<>"Yes"),"Fix soon: renews within 60 days and may not auto-renew.",'
        f'IF(OR(G{r}="",H{r}="",L{r}="",L{r}="Not sure"),"Check: fill in whose name, who pays and second admin.","")))))'
    )
    sv.cell(r, 14).font = f(9)
    sv.cell(r, 14).alignment = wrap
for ci, v in enumerate(example, start=2):
    c = sv.cell(first, ci, v)
    c.font = f(10, color='8A8A8A', italic=True)
sv.cell(first, 10).value = '=TODAY()+43'

tab = Table(displayName='Services', ref=f'B{HR}:N{last}')
tab.tableStyleInfo = TableStyleInfo(name='TableStyleLight1', showRowStripes=False)
sv.add_table(tab)
sv.freeze_panes = f'C{first}'

def dv(ws, options, ref, prompt):
    v = DataValidation(type='list', formula1='"' + ','.join(options) + '"', allow_blank=True, showDropDown=False)
    v.promptTitle = 'Choose one'; v.prompt = prompt; v.showInputMessage = True
    ws.add_data_validation(v); v.add(ref)

dv(sv, ['Domain registration', 'DNS (domain settings)', 'Website hosting', 'Email', 'Email sending service', 'Database or app backend', 'Other service'], f'C{first}:C{last}', 'What kind of service is this?')
who = ['The client', 'The builder', 'Someone else']
dv(sv, who, f'G{first}:H{last}', 'Whose name the account is in, or who pays.')
dv(sv, ['Yes', 'No', 'Not sure'], f'K{first}:L{last}', 'Yes, No or Not sure')

sv.conditional_formatting.add(f'N{first}:N{last}', FormulaRule(formula=[f'LEFT(N{first},7)="Serious"'], font=Font(name=SANS, color=RED, bold=True), fill=fill(RED_BG)))
sv.conditional_formatting.add(f'N{first}:N{last}', FormulaRule(formula=[f'LEFT(N{first},8)="Fix soon"'], font=Font(name=SANS, color=AMBER, bold=True), fill=fill(AMBER_BG)))
sv.conditional_formatting.add(f'N{first}:N{last}', FormulaRule(formula=[f'LEFT(N{first},5)="Check"'], font=Font(name=SANS, color=MUTED)))

# ---------------- Domains ----------------
dm = wb.create_sheet('Domains')
title(dm, 'Domains', 'Every domain name, and when it renews. A lapsed domain takes the website and email down.')
dh = ['Domain', 'Registrar', 'Renews', 'Days left', 'Auto-renews', 'DNS host', 'Website host', 'Email host', 'Certificate expires']
dw = [26, 18, 14, 11, 12, 18, 18, 22, 18]
dm.column_dimensions['A'].width = 3
for i, (h, w) in enumerate(zip(dh, dw), start=2):
    dm.column_dimensions[chr(64 + i)].width = w
    c = dm.cell(HR, i, h); c.font = f(9, bold=True, color='FFFFFF', mono=True); c.fill = fill(INK); c.alignment = Alignment(vertical='center')
dm.row_dimensions[HR].height = 24
dlast = HR + 15
for r in range(first, dlast + 1):
    for ci in range(2, 11):
        c = dm.cell(r, ci); c.fill = fill(INPUT_BG); c.border = under; c.font = f(10)
    dm.cell(r, 4).number_format = 'd mmm yyyy'
    dm.cell(r, 10).number_format = 'd mmm yyyy'
    dm.cell(r, 5).value = f'=IF(D{r}="","",D{r}-TODAY())'
    dm.cell(r, 5).fill = PatternFill(fill_type=None)
    dm.cell(r, 5).font = f(10, bold=True)
for ci, v in enumerate(['village-arts-trail.org', 'GoDaddy', None, None, 'Not sure', 'GoDaddy', 'Vercel', 'Google Workspace', None], start=2):
    if v: dm.cell(first, ci, v).font = f(10, color='8A8A8A', italic=True)
dm.cell(first, 4).value = '=TODAY()+43'
dm.cell(first, 10).value = '=TODAY()+80'
t2 = Table(displayName='Domains', ref=f'B{HR}:J{dlast}')
t2.tableStyleInfo = TableStyleInfo(name='TableStyleLight1', showRowStripes=False)
dm.add_table(t2)
dm.freeze_panes = f'C{first}'
dv(dm, ['Yes', 'No', 'Not sure'], f'F{first}:F{dlast}', 'Yes, No or Not sure')
dm.conditional_formatting.add(f'E{first}:E{dlast}', FormulaRule(formula=[f'AND(ISNUMBER(E{first}),E{first}<0)'], font=Font(name=SANS, color=RED, bold=True), fill=fill(RED_BG)))
dm.conditional_formatting.add(f'E{first}:E{dlast}', FormulaRule(formula=[f'AND(ISNUMBER(E{first}),E{first}<=60)'], font=Font(name=SANS, color=AMBER, bold=True), fill=fill(AMBER_BG)))
dm.conditional_formatting.add(f'E{first}:E{dlast}', FormulaRule(formula=[f'ISNUMBER(E{first})'], font=Font(name=SANS, color=GREEN, bold=True)))

# ---------------- Contacts ----------------
ct = wb.create_sheet('Contacts')
title(ct, 'Contacts', 'Who to call, in order.')
ct.column_dimensions['A'].width = 3
for i, (h, w) in enumerate(zip(['Who', 'Name', 'Why', 'Phone', 'Email'], [22, 24, 42, 18, 28]), start=2):
    ct.column_dimensions[chr(64 + i)].width = w
    c = ct.cell(HR, i, h); c.font = f(9, bold=True, color='FFFFFF', mono=True); c.fill = fill(INK)
ct.row_dimensions[HR].height = 24
people = [('Emergency contact', 'Can reach the builder’s accounts and passwords'), ('Technical helper', 'Can take the technical work over'),
          ('The builder', 'Built and looks after the website'), ('The owner', 'Makes the decisions'), ('', ''), ('', '')]
for k, (who_, why) in enumerate(people):
    r = first + k
    for ci in range(2, 7):
        c = ct.cell(r, ci); c.fill = fill(INPUT_BG); c.border = under; c.font = f(10)
    ct.cell(r, 2, who_ or None).font = f(10, bold=True)
    ct.cell(r, 4, why or None).font = f(10, color=MUTED)
    ct.row_dimensions[r].height = 22
t3 = Table(displayName='Contacts', ref=f'B{HR}:F{first + len(people) - 1}')
t3.tableStyleInfo = TableStyleInfo(name='TableStyleLight1', showRowStripes=False)
ct.add_table(t3)

for ws in wb.worksheets:
    ws.sheet_properties.tabColor = GREEN if ws.title == 'Start here' else 'BFBFBF'
    ws.page_setup.orientation = 'landscape'
    ws.page_setup.fitToWidth = 1; ws.page_setup.fitToHeight = 0
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    ws.oddFooter.left.text = 'No passwords in this file · sparekey.dev'
    ws.oddFooter.right.text = 'Page &P of &N'

wb.properties.title = 'Website continuity plan'
wb.properties.creator = 'Spare Key'
OUT.parent.mkdir(exist_ok=True)
wb.save(OUT)
print('Wrote', OUT)
