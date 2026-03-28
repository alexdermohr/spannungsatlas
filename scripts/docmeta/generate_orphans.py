#!/usr/bin/env python3
"""Generate docs/_generated/orphans.md and docs/_generated/weak-links.md.

Orphans are documents not linked from anywhere (excluding entry points).
Weak-links are documents that are referenced *only* from navigation documents
(e.g. ``docs/index.md``) but not from any content document — they are
technically linked but not inhaltlich eingebettet.

**What counts as "inhaltliche Einbettung" (content embedding)?**

- Markdown-Links from non-navigation documents, **and**
- valid ``related_docs`` entries from non-navigation documents.

Navigation documents (``canonicality: navigation`` or ``doc_type: navigation``)
contribute only *navigational* links.  Unknown ``related_docs`` IDs are ignored
(they do not count as embedding).

Usage: python scripts/docmeta/generate_orphans.py
"""

import re
from datetime import datetime, timezone
from pathlib import Path

from frontmatter_utils import parse_frontmatter

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
OUTPUT_ORPHANS = REPO_ROOT / "docs" / "_generated" / "orphans.md"
OUTPUT_WEAK = REPO_ROOT / "docs" / "_generated" / "weak-links.md"
GENERATED_PREFIX = "docs/_generated/"

SCAN_PATHS = [
    REPO_ROOT / "README.md",
    REPO_ROOT / "MASTERPLAN.md",
    REPO_ROOT / "AGENTS.md",
    REPO_ROOT / "docs",
]

LINK_PATTERN = re.compile(r"\[([^\]]*)\]\(([^)]+)\)")

# Files that are structural entry points and never orphans
ENTRY_POINTS = {"README.md", "MASTERPLAN.md", "AGENTS.md"}


def collect_files() -> list[Path]:
    """Collect Markdown files."""
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


def _is_navigation_doc(filepath: Path) -> bool:
    """Return True when a document has ``canonicality: navigation`` or ``doc_type: navigation``."""
    meta = parse_frontmatter(filepath)
    if not meta:
        return False
    return meta.get("canonicality") == "navigation" or meta.get("doc_type") == "navigation"


def extract_link_targets(filepath: Path) -> set[str]:
    """Extract resolved local link targets from a file."""
    text = filepath.read_text(encoding="utf-8")
    targets: set[str] = set()
    for _label, target in LINK_PATTERN.findall(text):
        if target.startswith(("http://", "https://", "#")):
            continue
        target = target.split("#")[0]
        if not target:
            continue
        resolved = (filepath.parent / target).resolve()
        try:
            rel = resolved.relative_to(REPO_ROOT).as_posix()
            targets.add(rel)
        except ValueError:
            continue
    return targets


def _build_id_to_path(files: list[Path]) -> dict[str, str]:
    """Map frontmatter ``id`` → repo-relative path for all scanned files."""
    mapping: dict[str, str] = {}
    for filepath in files:
        meta = parse_frontmatter(filepath)
        if meta and meta.get("id"):
            mapping[meta["id"]] = filepath.relative_to(REPO_ROOT).as_posix()
    return mapping


def _extract_related_targets(filepath: Path, id_to_path: dict[str, str]) -> set[str]:
    """Return repo-relative paths for valid ``related_docs`` entries."""
    meta = parse_frontmatter(filepath)
    if not meta:
        return set()
    related = meta.get("related_docs")
    if not isinstance(related, list):
        return set()
    targets: set[str] = set()
    for doc_id in related:
        if isinstance(doc_id, str) and doc_id in id_to_path:
            targets.add(id_to_path[doc_id])
    return targets


def main():
    files = collect_files()
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    id_to_path = _build_id_to_path(files)

    all_files: set[str] = set()
    # targets reached from content (non-navigation) documents
    content_targets: set[str] = set()
    # targets reached from navigation documents
    nav_targets: set[str] = set()

    for filepath in files:
        rel = filepath.relative_to(REPO_ROOT).as_posix()
        all_files.add(rel)

        md_targets = extract_link_targets(filepath)
        rel_targets = _extract_related_targets(filepath, id_to_path)
        combined = md_targets | rel_targets

        if _is_navigation_doc(filepath):
            nav_targets.update(combined)
        else:
            content_targets.update(combined)

    all_targets = content_targets | nav_targets

    # Orphans: files linked from nowhere and not entry points
    orphans = sorted(all_files - all_targets - ENTRY_POINTS)

    # Weak links: files linked ONLY from navigation (not content), excluding
    # entry points and orphans.
    # "Content" includes both Markdown-Links AND valid related_docs from
    # non-navigation documents.
    nav_only = nav_targets - content_targets
    weak = sorted((nav_only & all_files) - ENTRY_POINTS)

    # --- orphans.md ---
    orphan_lines = [
        "<!-- GENERATED FILE — DO NOT EDIT MANUALLY -->",
        f"<!-- Generated by scripts/docmeta/generate_orphans.py at {now} -->",
        "",
        "# Verwaiste Dokumente (Orphans)",
        "",
        "Dokumente, die von keinem anderen Dokument im Repo verlinkt werden.",
        "Einstiegspunkte (README.md, MASTERPLAN.md, AGENTS.md) sind ausgenommen.",
        "",
    ]

    if orphans:
        orphan_lines.append(f"**{len(orphans)} verwaiste(s) Dokument(e) gefunden:**")
        orphan_lines.append("")
        for orphan in orphans:
            orphan_lines.append(f"- `{orphan}`")
        orphan_lines.append("")
        orphan_lines.append(
            "> Diese Dokumente sollten entweder verlinkt oder bewusst als eigenständig markiert werden."
        )
    else:
        orphan_lines.append("Keine verwaisten Dokumente gefunden. Alle Dokumente sind verlinkt.")

    orphan_lines.append("")

    OUTPUT_ORPHANS.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_ORPHANS.write_text("\n".join(orphan_lines), encoding="utf-8")
    print(f"Generated {OUTPUT_ORPHANS.relative_to(REPO_ROOT)} ({len(orphans)} orphans)")

    # --- weak-links.md ---
    weak_lines = [
        "<!-- GENERATED FILE — DO NOT EDIT MANUALLY -->",
        f"<!-- Generated by scripts/docmeta/generate_orphans.py at {now} -->",
        "",
        "# Schwach eingebundene Dokumente",
        "",
        "Dokumente, die nur über Navigationsdokumente (z. B. `docs/index.md`) referenziert werden,",
        "aber von keinem inhaltlichen Dokument eingebunden sind.",
        "",
        "> **Was zählt als inhaltliche Einbettung?**",
        "> Markdown-Links *und* gültige `related_docs`-Einträge aus Nicht-Navigationsdokumenten.",
        "> Navigation (z. B. `docs/index.md`) zählt nicht als inhaltliche Einbettung.",
        "",
    ]

    if weak:
        weak_lines.append(f"**{len(weak)} schwach eingebundene(s) Dokument(e):**")
        weak_lines.append("")
        for w in weak:
            weak_lines.append(f"- `{w}`")
    else:
        weak_lines.append("Alle verlinkten Dokumente sind auch inhaltlich eingebunden.")

    weak_lines.append("")

    OUTPUT_WEAK.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_WEAK.write_text("\n".join(weak_lines), encoding="utf-8")
    print(f"Generated {OUTPUT_WEAK.relative_to(REPO_ROOT)} ({len(weak)} weak links)")


if __name__ == "__main__":
    main()
