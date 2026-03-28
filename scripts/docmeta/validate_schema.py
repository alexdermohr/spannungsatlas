#!/usr/bin/env python3
"""Validate YAML frontmatter in Markdown documents against docmeta schema.

Checks exactly the JSON-Schema keywords actually used in
``contracts/docmeta.schema.json``: required, type, enum, pattern,
minLength, format (date), items.type, and additionalProperties.

No external YAML or JSON-Schema library is used.

Usage: python scripts/docmeta/validate_schema.py [--strict]
"""

import datetime
import json
import re
import sys
from pathlib import Path

from frontmatter_utils import parse_frontmatter

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
SCHEMA_PATH = REPO_ROOT / "contracts" / "docmeta.schema.json"
GENERATED_PREFIX = "docs/_generated/"

# Directories/files to scan for frontmatter
SCAN_PATHS = [
    REPO_ROOT / "README.md",
    REPO_ROOT / "MASTERPLAN.md",
    REPO_ROOT / "docs",
]

# ISO-8601 date (YYYY-MM-DD) with basic calendar validity
_ISO_DATE_RE = re.compile(r"^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$")


def load_schema() -> dict:
    """Load the JSON schema."""
    with open(SCHEMA_PATH, encoding="utf-8") as f:
        return json.load(f)


def validate_against_schema(meta: dict, schema: dict) -> list[str]:
    """Validate frontmatter against the project schema.

    Supports the following JSON-Schema keywords as used in the repo schema:
    required, type (string / array), enum, pattern, minLength,
    format: date, items.type, additionalProperties: false.
    """
    errors: list[str] = []
    properties = schema.get("properties", {})

    # --- required ---
    for field in schema.get("required", []):
        if field not in meta:
            errors.append(f"Missing required field: '{field}'")

    # --- per-field checks ---
    for key, value in meta.items():
        if key not in properties:
            if schema.get("additionalProperties") is False:
                errors.append(f"Unknown field: '{key}'")
            continue

        prop = properties[key]
        expected_type = prop.get("type")

        # type: string
        if expected_type == "string":
            if not isinstance(value, str):
                errors.append(
                    f"Field '{key}': expected string, got {type(value).__name__}"
                )
                continue  # skip further string-specific checks

            # enum
            if "enum" in prop and value not in prop["enum"]:
                errors.append(
                    f"Field '{key}': value '{value}' not in allowed values {prop['enum']}"
                )

            # pattern
            if "pattern" in prop:
                if not re.fullmatch(prop["pattern"], value):
                    errors.append(
                        f"Field '{key}': value '{value}' does not match pattern /{prop['pattern']}/"
                    )

            # minLength
            if "minLength" in prop and len(value) < prop["minLength"]:
                errors.append(
                    f"Field '{key}': length {len(value)} is below minimum {prop['minLength']}"
                )

            # format: date  (ISO 8601 YYYY-MM-DD, calendar-valid)
            if prop.get("format") == "date":
                if not _ISO_DATE_RE.fullmatch(value):
                    errors.append(
                        f"Field '{key}': value '{value}' is not a valid ISO date (YYYY-MM-DD)"
                    )
                else:
                    try:
                        datetime.date.fromisoformat(value)
                    except ValueError:
                        errors.append(
                            f"Field '{key}': value '{value}' is not a valid calendar date"
                        )

        # type: array
        elif expected_type == "array":
            if not isinstance(value, list):
                errors.append(
                    f"Field '{key}': expected array, got {type(value).__name__}"
                )
                continue

            # items.type
            items_type = prop.get("items", {}).get("type")
            if items_type == "string":
                for idx, item in enumerate(value):
                    if not isinstance(item, str):
                        errors.append(
                            f"Field '{key}[{idx}]': expected string item, "
                            f"got {type(item).__name__}"
                        )

    return errors


def collect_markdown_files() -> list[Path]:
    """Collect all Markdown files to validate."""
    files = []
    for p in SCAN_PATHS:
        if p.is_file() and p.suffix == ".md":
            files.append(p)
        elif p.is_dir():
            for md in sorted(p.rglob("*.md")):
                rel = md.relative_to(REPO_ROOT).as_posix()
                if not rel.startswith(GENERATED_PREFIX):
                    files.append(md)
    return files


def main():
    strict = "--strict" in sys.argv
    schema = load_schema()
    files = collect_markdown_files()

    total = 0
    valid = 0
    errors_total = 0
    missing_frontmatter = []

    for filepath in files:
        rel = filepath.relative_to(REPO_ROOT).as_posix()
        total += 1
        meta = parse_frontmatter(filepath)

        if meta is None:
            missing_frontmatter.append(rel)
            if strict:
                print(f"  FAIL  {rel}: no frontmatter found")
                errors_total += 1
            else:
                print(f"  SKIP  {rel}: no frontmatter")
            continue

        errors = validate_against_schema(meta, schema)
        if errors:
            errors_total += len(errors)
            for err in errors:
                print(f"  FAIL  {rel}: {err}")
        else:
            valid += 1
            print(f"  OK    {rel}")

    print()
    print(f"Scanned: {total} | Valid: {valid} | Errors: {errors_total} | No frontmatter: {len(missing_frontmatter)}")

    if missing_frontmatter:
        print(f"Files without frontmatter: {', '.join(missing_frontmatter)}")

    if errors_total > 0:
        sys.exit(1)
    if strict and missing_frontmatter:
        sys.exit(1)

    sys.exit(0)


if __name__ == "__main__":
    main()
