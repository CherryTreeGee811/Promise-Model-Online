#!/usr/bin/env bash

OUTPUT_FILE="project_dump.txt"
ROOT_DIR="$(pwd)"

# Clear output file
> "$OUTPUT_FILE"

echo "Dumping project from: $ROOT_DIR"
echo ""

find "$ROOT_DIR" -type f \
  ! -path "*/.git/*" \
  ! -path "*/bin/*" \
  ! -path "*/obj/*" \
  ! -path "*/node_modules/*" \
  | sort | while read -r file; do

    rel_path="${file#$ROOT_DIR/}"

    echo "===== FILE: $rel_path =====" >> "$OUTPUT_FILE"

    # Only dump text files
    if file "$file" | grep -qE 'text|JSON|XML|ASCII|UTF-8'; then
        cat "$file" >> "$OUTPUT_FILE"
    else
        echo "[BINARY FILE SKIPPED]" >> "$OUTPUT_FILE"
    fi

    echo -e "\n\n" >> "$OUTPUT_FILE"
done

echo "✅ Dump completed: $OUTPUT_FILE"