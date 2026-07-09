#!/usr/bin/env bash
set -eu

RESULTS_DIR="${1:?Usage: $0 <results-dir> <line-threshold> [branch-threshold] [method-threshold]}"
LINE_THRESHOLD="${2:?}"
BRANCH_THRESHOLD="${3:-0}"
METHOD_THRESHOLD="${4:-0}"

exit_code=0

for f in "$RESULTS_DIR"/*/coverage.cobertura.xml; do
  [ -f "$f" ] || continue

  python3 - "$f" "$LINE_THRESHOLD" "$BRANCH_THRESHOLD" "$METHOD_THRESHOLD" << 'PYEOF'
import sys, xml.etree.ElementTree as ET

filepath = sys.argv[1]
threshold_line = float(sys.argv[2])
threshold_branch = float(sys.argv[3])
threshold_method = float(sys.argv[4])

exclude_patterns = [
    'Migrations/', 'Views/', 'Program.cs',
    'DesignTimeDbContextFactory', 'NoOpEmailService', 'OpenIddictSeeder'
]

def should_exclude(fname):
    for p in exclude_patterns:
        if p in fname:
            return True
    return False

root = ET.parse(filepath).getroot()
total_lines = 0
covered_lines = 0
total_branches = 0
covered_branches = 0
total_methods = 0
covered_methods = 0
failed_summary = []

for cls in root.findall('.//class'):
    fname = cls.get('filename', '')
    if should_exclude(fname):
        continue

    # Count lines: hits > 0 => covered
    cls_total = 0
    cls_covered = 0
    for line in cls.findall('.//lines/line'):
        cls_total += 1
        if int(line.get('hits', 0)) > 0:
            cls_covered += 1

    total_lines += cls_total
    covered_lines += cls_covered

    # Branch coverage from the branch-rate attribute
    br = float(cls.get('branch-rate', 0))
    total_branches += 1
    covered_branches += br

    # Method coverage
    t = 0
    c = 0
    for m in cls.findall('.//method'):
        t += 1
        if float(m.get('line-rate', 0)) > 0:
            c += 1
    total_methods += t
    covered_methods += c

    lr = cls_covered / cls_total if cls_total else 0
    mr = c / t if t else 0
    ok = lr >= threshold_line and (threshold_branch <= 0 or br >= threshold_branch) and (threshold_method <= 0 or mr >= threshold_method)
    if not ok:
        failed_summary.append((fname, lr, br, mr))

avg_line = covered_lines / total_lines if total_lines else 0
avg_branch = covered_branches / total_branches if total_branches else 0
avg_method = covered_methods / total_methods if total_methods else 0

print(f'  [excl. auto-gen] line={avg_line:.2%} branch={avg_branch:.2%} method={avg_method:.2%}')

ok = avg_line >= threshold_line and (threshold_branch <= 0 or avg_branch >= threshold_branch) and (threshold_method <= 0 or avg_method >= threshold_method)

if not ok:
    print(f'  FAIL: below {threshold_line:.0%} line / {threshold_branch:.0%} branch / {threshold_method:.0%} method')
    sys.exit(1)

if failed_summary:
    print(f'  Info - files below thresholds ({len(failed_summary)}):')
    for fname, lr, br, mr in failed_summary[:10]:
        print(f'    {fname}: line={lr:.2%} branch={br:.2%} method={mr:.2%}')
    if len(failed_summary) > 10:
        print(f'    ... and {len(failed_summary) - 10} more')

sys.exit(0)
PYEOF
  PYEXIT=$?
  if [ $PYEXIT -ne 0 ]; then
    exit_code=1
  fi
done

exit $exit_code
