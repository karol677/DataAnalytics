#!/usr/bin/env python3
"""
Simple, local accessibility checks for the provided `index.html`.
Checks performed (basic, static):
- html@lang
- title existence and length
- meta description
- viewport meta
- presence of skip link
- presence of header/main/nav/footer landmarks
- H1 existence and count
- images missing alt
- links missing accessible name
- buttons missing accessible name
- inputs without labels
"""
import sys
from pathlib import Path

try:
    import sys
    from pathlib import Path
    import re

    FILE = Path(__file__).parents[1] / 'index.html'
    if not FILE.exists():
        print(f'ERROR: index.html not found at {FILE}')
        sys.exit(1)

    html = FILE.read_text(encoding='utf-8')
    text = html.lower()

    issues = []

    # Helper: simple attr parser for a tag string
    def parse_attrs(tag_text):
        attrs = {}
        for m in re.finditer(r"(\w[\w-]*)\s*=\s*(?:\"([^\"]*)\"|'([^']*)'|([^\s>]+))", tag_text):
            k = m.group(1).lower()
            v = m.group(2) or m.group(3) or m.group(4) or ''
            attrs[k] = v
        return attrs

    # html lang
    m = re.search(r'<html([^>]*)>', html, re.I)
    lang = None
    if m:
        attrs = parse_attrs(m.group(1))
        lang = attrs.get('lang')
    if not lang:
        issues.append(('error', '<html> element missing a valid lang attribute'))

    # title
    mt = re.search(r'<title>(.*?)</title>', html, re.I | re.S)
    title = mt.group(1).strip() if mt else ''
    if not title:
        issues.append(('error', '<title> is missing or empty'))
    elif len(title) > 70:
        issues.append(('warn', f'<title> is long ({len(title)} chars)'))

    # meta description
    if not re.search(r'<meta[^>]*\bname=["\']?description["\']?[^>]*>', html, re.I):
        issues.append(('warn', 'meta description is missing or empty'))

    # viewport
    if not re.search(r'<meta[^>]*\bname=["\']?viewport["\']?[^>]*>', html, re.I):
        issues.append(('warn', 'viewport meta tag is missing'))

    # skip link
    if not re.search(r'<a[^>]*class=["\'][^"\']*skip-link|<a[^>]*href=["\']#(main|content|top)["\']', html, re.I):
        issues.append(('warn', 'Skip-link to main content not found'))

    # landmarks
    for landmark in ('header','main','nav','footer'):
        if not re.search(r'<%s\b' % landmark, html, re.I):
            issues.append(('warn', f'Landmark <{landmark}> not found'))

    # H1
    h1s = re.findall(r'<h1\b[^>]*>(.*?)</h1>', html, re.I | re.S)
    if len(h1s) == 0:
        issues.append(('error', 'No <h1> found'))
    elif len(h1s) > 1:
        issues.append(('warn', f'More than one <h1> found ({len(h1s)})'))

    # images without alt
    for m in re.finditer(r'<img\b([^>]*)>', html, re.I):
        attrs = parse_attrs(m.group(1))
        alt = attrs.get('alt')
        src = attrs.get('src','')
        if alt is None:
            issues.append(('error', f'<img> missing alt attribute (src="{src}")'))
        elif alt.strip() == '':
            issues.append(('warn', f'<img> has empty alt (decorative?) (src="{src}")'))

    # links without accessible name
    for m in re.finditer(r'<a\b([^>]*)>(.*?)</a>', html, re.I | re.S):
        tag_attrs = parse_attrs(m.group(1))
        inner = re.sub(r'<[^>]+>','', m.group(2)).strip()
        href = tag_attrs.get('href','')
        if not inner and not tag_attrs.get('aria-label'):
            issues.append(('warn', f'<a> without link text or aria-label (href="{href}")'))

    # buttons without accessible name
    for m in re.finditer(r'<button\b([^>]*)>(.*?)</button>', html, re.I | re.S):
        attrs = parse_attrs(m.group(1))
        inner = re.sub(r'<[^>]+>','', m.group(2)).strip()
        if not inner and not attrs.get('aria-label'):
            issues.append(('warn', '<button> with no accessible name'))

    # inputs without labels
    inputs = list(re.finditer(r'<input\b([^>]*)>', html, re.I))
    labels_for = [m.group(1) for m in re.finditer(r'<label[^>]*for=["\']([^"\']+)["\'][^>]*>', html, re.I)]
    for m in inputs:
        attrs = parse_attrs(m.group(1))
        typ = attrs.get('type','').lower()
        if typ in ('hidden','submit','image','button'):
            continue
        id_ = attrs.get('id')
        has_label = False
        if id_ and id_ in labels_for:
            has_label = True
        if re.search(r'<label[^>]*>\s*<input[^>]*id=["\']%s["\']' % (id_ if id_ else ''), html, re.I):
            has_label = True
        if attrs.get('aria-label') or attrs.get('aria-labelledby'):
            has_label = True
        if not has_label:
            issues.append(('warn', f'Input of type "{typ}" appears unlabelled'))

    # report
    errs = [i for i in issues if i[0]=='error']
    wrns = [i for i in issues if i[0]=='warn']

    print('Accessibility quick-check results for index.html')
    print('File:', FILE)
    print('Errors:', len(errs), 'Warnings:', len(wrns))
    print('-' * 60)
    for sev, msg in issues:
        marker = 'ERROR' if sev=='error' else 'WARN '
        print(f'{marker}: {msg}')

    if not issues:
        print('No issues found by this basic scanner.')

    sys.exit(1 if errs else 0)
