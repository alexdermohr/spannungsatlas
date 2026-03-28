# AGENTS.md — Arbeitsregeln für Agenten im spannungsatlas-Repo

## Lesereihenfolge

1. `README.md` — Einstieg
2. `MASTERPLAN.md` — Kanonisches Produktdokument
3. `docs/ux-ui-blaupause.md` — UX/UI-Konzept
4. `docs/icf-integration-blaupause.md` — ICF-Integrationskonzept
5. `docs/index.md` — Navigation (nicht kanonisch)

## Wahrheitshierarchie

Bei Widersprüchen gilt:

1. `MASTERPLAN.md` (höchste Priorität)
2. `docs/ux-ui-blaupause.md`
3. `docs/icf-integration-blaupause.md`
4. `README.md`

`docs/index.md` und alle Dateien unter `docs/_generated/` sind **Navigation**, nicht Wahrheit.

## Kernregeln

### No Silent Interpolation

Agenten dürfen keine Informationen erfinden, interpolieren oder aus externen Quellen
stillschweigend einfügen. Jede inhaltliche Ergänzung muss explizit als solche markiert
und begründet werden.

### Frontmatter-Pflicht

Kanonische Markdown-Dokumente benötigen YAML-Frontmatter gemäß
`contracts/docmeta.schema.json`. Mindestfelder: `id`, `title`, `doc_type`, `status`,
`canonicality`.

### Generated Files

- Dateien unter `docs/_generated/` sind **abgeleitete Artefakte**.
- Sie dürfen **niemals** direkt editiert werden.
- Änderungen erfolgen **ausschließlich** durch Ausführung der Generatoren unter `scripts/docmeta/`.
- Jede generierte Datei enthält einen Header-Hinweis.

### Konflikte

- Kanonische Fachdokumente haben Vorrang vor Navigationsartefakten.
- Bei Unsicherheit: lieber explizite Leerstelle als Fantasie-Ergänzung.
- Keine stillen Änderungen an MASTERPLAN.md ohne klare Begründung.

## Referenzen

- Repo-Identität: `repo.meta.yaml`
- Agentenrichtlinie: `agent-policy.yaml`
- Frontmatter-Schema: `contracts/docmeta.schema.json`
