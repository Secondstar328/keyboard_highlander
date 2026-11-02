#!/bin/bash
# 갈무리 폰트를 게임에 나오는 글자만 담아 다시 만든다.
# 필요: npm, python3 + fonttools·brotli (pip install fonttools brotli)
# 사용: bash tools/make-fonts.sh   (저장소 맨 위에서)
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
( cd "$TMP" && npm pack galmuri@2.40.3 >/dev/null && tar -xzf galmuri-*.tgz )
python3 - "$ROOT/site/index.html" "$TMP/chars.txt" <<'PY'
import sys, string
s = open(sys.argv[1], encoding='utf-8').read()
chars = set(s) | set(string.printable) | set('０１２３４５６７８９…·「」『』→←↑↓▲▼■□█░┃✓✕★☆♥♡%₩')
open(sys.argv[2], 'w', encoding='utf-8').write(''.join(sorted(c for c in chars if not c.isspace() or c == ' ')))
print(len(chars), 'chars')
PY
for f in Galmuri11 Galmuri11-Bold GalmuriMono11; do
  pyftsubset "$TMP/package/dist/$f.ttf" --text-file="$TMP/chars.txt" --flavor=woff2 --layout-features='*' --output-file="$ROOT/site/fonts/$f.woff2" 2>/dev/null
done
cp "$TMP/package/ofl.md" "$ROOT/site/fonts/LICENSE-Galmuri.md"
ls -la "$ROOT/site/fonts"
rm -rf "$TMP"
