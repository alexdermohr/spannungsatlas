#!/usr/bin/env python3
"""Validate YAML frontmatter in Markdown documents against docmeta schema.

Usage: python scripts/docmeta/validate_schema.py [--strict]
"""

import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
SCHEMA_PATH = REPO_ROOT / "contracts" / "docmeta.schema.json"
GENERATED_PREFIX = "docs/_generated/"

# Directories/files to scan for frontmatter
SCAN_PATHS = [
    REPO_ROOT / "README.md",
    REPO_ROOT / "MASTERPLAN.md",
    REPO_ROOT / "docs",
]


def parse_frontmatter(filepath: Path) -> dict | None:
    """Extract YAML frontmatter from a Markdown file. Returns None if absent."""
    text = filepath.read_text(encoding="utf-8")
    match = re.match(r"^---\n(.*?\n)---\n", text, re.DOTALL)
    if not match:
        return None
    # Minimal YAML parsing without external dependency
    raw = match.group(1)
    return _parse_simple_yaml(raw)


def _parse_simple_yaml(raw: str) -> dict:
    """Very simple YAML-subset parser for flat frontmatter."""
    result = {}
    current_key = None
    current_list = None

    for line in raw.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue

        # List item
        if stripped.startswith("- ") and current_key:
            if current_list is None:
                current_list = []
            value = stripped[2:].strip().strip('"').strip("'")
            current_list.append(value)
            result[current_key] = current_list
            continue

        # Key-value pair
        if ":" in stripped:
            # Save any pending list
            if current_list is not None:
                current_list = None

            colon_idx = stripped.index(":")
            key = stripped[:colon_idx].strip()
            value = stripped[colon_idx + 1:].strip().strip('"').strip("'")

            current_key = key
            if value:
                result[key] = value
                current_list = None
            else:
                # Might be followed by a list
                current_list = None

    return result


def load_schema() -> dict:
    """Load the JSON schema."""
    with open(SCHEMA_PATH, encoding="utf-8") as f:
        return json.load(f)


def validate_against_schema(meta: dict, schema: dict) -> list[str]:
    """Basic validation of frontmatter against schema. Returns list of errors."""
    errors = []

    # Check required fields
    for field in schema.get("required", []):
        if field not in meta:
            errors.append(f"Missing required field: '{field}'")

    # Check enum constraints
    properties = schema.get("properties", {})
    for key, value in meta.items():
        if key not in properties:
            if schema.get("additionalProperties") is False:
                errors.append(f"Unknown field: '{key}'")
            continue

        prop = properties[key]

        # Enum check
        if "enum" in prop and value in (str,):
            pass
        if "enum" in prop and isinstance(value, str) and value not in prop["enum"]:
            errors.append(f"Field '{key}': value '{value}' not in allowed values {prop['enum']}")

        # Type check (basic)
        expected_type = prop.get("type")
        if expected_type == "string" and not isinstance(value, str):
            errors.append(f"Field '{key}': expected string, got {type(value).__name__}")
        elif expected_type == "array" and not isinstance(value, list):
            errors.append(f"Field '{key}': expected array, got {type(value).__name__}")

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
