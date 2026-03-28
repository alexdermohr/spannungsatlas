"""Shared frontmatter parsing utilities for docmeta scripts.

Provides a single, robust YAML-subset parser used by all generators and
the schema validator.  No external dependencies — only the standard library.

The regex handles ``\\n``, ``\\r\\n``, and a missing trailing newline after
the closing ``---``.
"""

import re
from pathlib import Path

# Robust frontmatter delimiter that handles \n, \r\n, and missing
# trailing newline after the closing ---.
_FRONTMATTER_RE = re.compile(
    r"^---\r?\n(.*?\r?\n)---(?:\r?\n|$)", re.DOTALL
)


def parse_frontmatter(filepath: Path) -> dict | None:
    """Extract YAML frontmatter from a Markdown file.

    Returns a ``dict`` of parsed key/value pairs, or ``None`` when no
    frontmatter block is found.
    """
    text = filepath.read_text(encoding="utf-8")
    return parse_frontmatter_string(text)


def parse_frontmatter_string(text: str) -> dict | None:
    """Parse frontmatter from a raw string (useful for testing)."""
    match = _FRONTMATTER_RE.match(text)
    if not match:
        return None
    return _parse_simple_yaml(match.group(1))


def _parse_simple_yaml(raw: str) -> dict:
    """Very simple YAML-subset parser for flat frontmatter.

    Supports:
    - scalar key-value pairs (strings only)
    - lists of strings (indented ``- item`` lines)
    - quoted and unquoted values
    - comment lines starting with ``#``
    """
    result: dict = {}
    current_key: str | None = None
    current_list: list | None = None

    for line in raw.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue

        # List item — only valid when an explicit list mode was opened (key: with no value)
        if stripped.startswith("- ") and current_list is not None:
            value = stripped[2:].strip().strip('"').strip("'")
            current_list.append(value)
            result[current_key] = current_list
            continue

        # Key-value pair
        if ":" in stripped:
            # Reset pending list
            current_list = None

            colon_idx = stripped.index(":")
            key = stripped[:colon_idx].strip()
            value = stripped[colon_idx + 1 :].strip().strip('"').strip("'")

            current_key = key
            if value:
                result[key] = value
                current_list = None
            else:
                # No inline value — open list mode; items may follow on subsequent lines
                current_list = []

    return result
