---
id: docs-index
title: "Spannungsatlas – Dokumentationsübersicht"
doc_type: navigation
status: active
canonicality: navigation
summary: "Navigationsdokument: geordnete Einstiegskarte in die Repo-Dokumentation."
related_docs:
  - perspektiven-blaupause
  - perspective-record
  - masterplan
  - ux-ui-blaupause
  - icf-integration-blaupause
  - roadmap
last_reviewed: "2026-04-03"
---

# Spannungsatlas – Dokumentationsübersicht

> **Hinweis:** Dies ist ein Navigationsdokument. Bei Widersprüchen gelten die verlinkten
> kanonischen Fachdokumente. Siehe `AGENTS.md` für die Wahrheitshierarchie.

## Produkt / Kanon

| Dokument | Beschreibung |
|----------|-------------|
| [MASTERPLAN.md](../MASTERPLAN.md) | Kanonisches Produktdokument — Produktdefinition, Invarianten, Kernobjekte, Taxonomie |
| [README.md](../README.md) | Repo-Einstieg mit Kurzbeschreibung |

## Architektur

| Dokument | Beschreibung |
|----------|-------------|
| [Deploy-Blaupause mit Vercel](deploy-blaupause.md) | Architektur-Entscheidung: Vercel für UI, Entkopplung des Produktkerns |

## UX / UI

| Dokument | Beschreibung |
|----------|-------------|
| [UX/UI-Blaupause](ux-ui-blaupause.md) | Konzeptionelle UX/UI-Prinzipien, Ebenen, Nutzerfluss, Informationsarchitektur |
| [Perspektiven-Blaupause](blueprints/perspektiven-blaupause.md) | Konzept zur blinden Erfassung von Perspektiven zur Vermeidung von Konformität |

## Integrationen

| Dokument | Beschreibung |
|----------|-------------|
| [ICF-Integrations-Blaupause](icf-integration-blaupause.md) | Konzeptionelle Integration von icf-tool in den Spannungsatlas |

## Datenmodelle

| Dokument | Beschreibung |
|----------|-------------|
| [PerspectiveRecord](reference/perspective-record.md) | Domain-Modell für unabhängige Perspektiven-Artefakte |

## Planung

| Dokument | Beschreibung |
|----------|-------------|
| [Ausbauplan nach Phase 0/1](roadmap.md) | Geordneter Ausbaupfad, orientiert am bestehenden Produktkanon (informational) |

## Web-Anwendung

| Pfad | Beschreibung |
|------|-------------|
| [apps/web/](../apps/web/) | SvelteKit-Webschicht (Vercel-Adapter, local-first, konsumiert `src/domain/`) |

## Repo-Struktur / Meta

| Dokument | Beschreibung |
|----------|-------------|
| [AGENTS.md](../AGENTS.md) | Arbeitsregeln für Agenten im Repo |
| [repo.meta.yaml](../repo.meta.yaml) | Kanonische Repo-Identität |
| [agent-policy.yaml](../agent-policy.yaml) | Agentenrichtlinie |
| [docmeta.schema.json](../contracts/docmeta.schema.json) | Frontmatter-Schema |

## Generierte Übersichten

> Diese Dateien werden automatisch erzeugt. Nicht manuell editieren.

| Dokument | Beschreibung |
|----------|-------------|
| [Dokumenten-Index](_generated/doc-index.md) | Automatisch generierter Index aller Dokumente mit Frontmatter |
| [Backlinks](_generated/backlinks.md) | Querverweise zwischen Dokumenten |
| [Orphans](_generated/orphans.md) | Verwaiste Dokumente ohne Verlinkung |
| [Schwach eingebunden](_generated/weak-links.md) | Dokumente, die nur navigativ eingebunden sind |
| [System-Map](_generated/system-map.md) | Strukturübersicht des Repos |
