import os
import sys

# Attempt to install pypdf
os.system('python3 -m pip install --user pypdf')

try:
    import pypdf
except ImportError:
    print("Failed to import pypdf")
    sys.exit(1)

with open('srs_content.txt', 'w', encoding='utf-8') as out_f:
    reader = pypdf.PdfReader('SRS_Delhi_Metro_Smart_Ticketing (2).pdf')
    for i, page in enumerate(reader.pages):
        text = page.extract_text()
        if text:
            out_f.write(text + "\n")
print("Extraction complete.")
