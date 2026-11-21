from pathlib import Path
from io import BytesIO
from hashlib import sha256
from html import unescape
import json
from docx import Document
from docx.text.paragraph import Paragraph
from docx.table import Table

path=Path('outputs/style-markdown-conversion/verification.json')
report=json.loads(path.read_text())
for record in report['documents']:
    archive=Path(record['archive'])
    data=archive.read_bytes()
    assert sha256(data).hexdigest()==record['sourceAndArchiveSha256']
    document=Document(BytesIO(data))
    markdown=Path(record['markdown']).read_text(encoding='utf-8')
    decoded=' '.join(unescape(markdown.replace('<br>','\n')).split())
    cursor=0
    count=0
    for block in document.iter_inner_content():
        if isinstance(block,Paragraph):
            texts=[block.text]
        elif isinstance(block,Table):
            texts=['\n'.join(p.text for p in cell.paragraphs) for row in block.rows for cell in row.cells]
        for text in texts:
            expected=' '.join(text.split())
            if not expected: continue
            position=decoded.find(expected,cursor)
            assert position>=cursor, f'Missing or reordered text: {expected[:80]}'
            cursor=position+len(expected)
            count+=1
    table_lines=[line for line in markdown.splitlines() if line.startswith('| ')]
    assert len(table_lines)==record['tableRowsPreserved']+record['tablesPreserved']
    record['independentReadbackVerified']=True
    record['paragraphsAndCellsChecked']=count
    assert not Path(record['source']).exists(), 'An active Word file has reappeared.'
report['activeFormat']='Markdown'
report['wordRenderingRequired']=False
path.write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report))
