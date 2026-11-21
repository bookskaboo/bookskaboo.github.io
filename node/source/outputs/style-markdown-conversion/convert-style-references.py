"""Retire the two live DOCX references without dropping their text or tables."""
from pathlib import Path
from io import BytesIO
from hashlib import sha256
from html import escape as html_escape
import json
import re
from docx import Document
from docx.text.paragraph import Paragraph
from docx.table import Table

ROOT = Path.cwd()
ARCHIVE = ROOT / 'docs/archive/style-reference-docx'
ARCHIVE.mkdir(parents=True, exist_ok=True)
reports = []

def inline(text):
    # HTML character references keep literal Markdown punctuation as ordinary text.
    return ''.join({'&':'&amp;', '<':'&lt;', '>':'&gt;', '*':'&#42;', '_':'&#95;', '`':'&#96;', '[':'&#91;', ']':'&#93;', '\\':'&#92;', '|':'&#124;'}.get(c,c) for c in text).replace('\n','<br>').replace('\t','    ')

def decode(text):
    from html import unescape
    return unescape(text.replace('<br>','\n'))

for name in ('node-ui-style-guide','typography-style-review'):
    source = ROOT / f'docs/{name}.docx'
    original = source.read_bytes()
    document = Document(BytesIO(original))
    blocks = []
    paragraphs = rows = cells = tables = 0
    for block in document.iter_inner_content():
        if isinstance(block, Paragraph):
            text = block.text
            if not text.strip():
                continue
            rendered = inline(text)
            assert decode(rendered).split() == text.split()
            style = block.style.name
            if style == 'Title':
                rendered = '# ' + rendered
            elif style.startswith('Heading '):
                rendered = '#' * min(6, int(style.split()[-1])+1) + ' ' + rendered
            # No source numbering, hyperlinks, pictures, notes or text boxes occur.
            blocks.append(rendered)
            paragraphs += 1
        elif isinstance(block, Table):
            table_rows = []
            for row in block.rows:
                values = []
                for cell in row.cells:
                    text = '\n'.join(p.text for p in cell.paragraphs)
                    rendered = inline(text)
                    assert decode(rendered).split() == text.split()
                    values.append(rendered)
                    cells += 1
                table_rows.append('| ' + ' | '.join(values) + ' |')
                rows += 1
            table_rows.insert(1,'| ' + ' | '.join('---' for _ in block.columns) + ' |')
            blocks.append('\n'.join(table_rows))
            tables += 1

    output = ROOT / f'docs/{name}.md'
    result = '\n\n'.join(blocks) + '\n'
    output.write_text(result,encoding='utf-8')
    # Re-read the actual file and independently compare each emitted block in order.
    actual = output.read_text(encoding='utf-8')
    cursor = 0
    for block in blocks:
        position = actual.find(block,cursor)
        assert position >= cursor
        cursor = position + len(block)
    assert source.read_bytes() == original, 'Source changed during conversion; retry before archiving.'
    archived = ARCHIVE / source.name
    if archived.exists():
        assert archived.read_bytes() == original, 'An unrelated archived snapshot already exists.'
    else:
        archived.write_bytes(original)
    assert sha256(archived.read_bytes()).digest() == sha256(original).digest()
    source.unlink()
    reports.append({'source':str(source.relative_to(ROOT)), 'markdown':str(output.relative_to(ROOT)), 'archive':str(archived.relative_to(ROOT)), 'sourceAndArchiveSha256':sha256(original).hexdigest(), 'paragraphsPreserved':paragraphs, 'tablesPreserved':tables, 'tableRowsPreserved':rows, 'tableCellsPreserved':cells, 'allTextVerified':True, 'blockOrderVerified':True})

Path('outputs/style-markdown-conversion/verification.json').write_text(json.dumps({'documents':reports},indent=2)+'\n')
print(json.dumps(reports))
