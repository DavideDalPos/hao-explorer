# How the Hymenoptera Anatomy Ontology website was built

This explains how the website in this folder (`hao-explorer`, GitHub: DavideDalPos/hao-explorer) works and how it
came together: what it is made of, where each piece of information comes from, and why things were done the way
they were. For day-to-day tasks, see the how-to guides instead:
[MAKING-A-RELEASE.md](MAKING-A-RELEASE.md), [ADDING-REFERENCES.md](ADDING-REFERENCES.md),
[UPDATING-REFERENCES.md](UPDATING-REFERENCES.md).

## 1. The idea

HAO is published as an ontology (OWL/OBO files, browsable in the Ontology Lookup Service), which is precise but hard
to read for taxonomists, students and the public. The old HAO portal (portal.hymao.org) was serious but dated, and its
bibliography service (api.hymao.org) is going away. The goal was a friendly website that:

- shows every term with its definition, synonyms (each traced to the work that used it), relations and identifiers;
- lets people explore the anatomy visually instead of through a list;
- takes its references (and later images) from **TaxonWorks**, where they can be curated;
- updates itself when a new release of the ontology is made.

The ontology itself stays the authority. The website only **reads**: it never changes the ontology or TaxonWorks.

## 2. The pieces

```
GitHub\HAO\
├── hao2\           the ontology (ODK repository) → releases hao.obo / hao.owl
├── hao-explorer\   this website (Vue)            → reads hao2 + TaxonWorks + GitHub releases
└── archive\        old material (first pilot, ODK seed files, old reference list)
```

| Source | What the website takes from it |
|---|---|
| **hao2**: `hao.obo` (the release) | terms, definitions, synonyms with their reference addresses, relations, obsolete terms, editors |
| **TaxonWorks**, HAO project (sfg.taxonworks.org, read through its API) | clean citations of the references, their links (BHL, DOI), the old hymao number of each (URI identifier), and which group (OTU / taxon name) each work deals with |
| **GitHub releases** of hao2 | the list of versions (tag, name such as HAO 2.1.0, notes) and the `hao.obo` of each, to compare versions |
| `data/hymao-refs.json` | the old HAO bibliography (468 citations), saved once from api.hymao.org, used for references not yet in TaxonWorks |

## 3. Technology

- **Vue 3** with **Vite**: a static website (plain HTML, CSS and JavaScript files after building), so it can be
  hosted for free on **GitHub Pages**. No server or database.
- **vue-router** with "hash" links (`#/term/HAO_0000575`), so every page has its own shareable address on any static host.
- **Cytoscape.js** for the network of connections on term pages.
- **d3-hierarchy** and **d3-shape** for the zoomable map of the body on the start page.
- Everything else (timeline, charts, tables) is hand-written SVG/HTML and CSS.
- Fonts: IBM Plex Sans / Mono and Source Serif 4 (Google Fonts). Light and black themes.

## 4. How the data is prepared (`scripts/build-data.mjs`)

The website does not read the ontology in the browser. Before the site starts (`npm run dev`) or is built
(`npm run build`), a script prepares one compact file, `public/data/hao.json`, which the pages load. It is generated
every time and never committed.

What the script does, in order:

1. **Finds the ontology**: `../hao2/hao.obo` if the hao2 folder is next to this one (your computer), otherwise it
   downloads `hao.obo` from hao2's main branch on GitHub (the online build). Paths are in `explorer.config.json`.
2. **Reads the OBO file** stanza by stanza: for each term its name, definition and definition references, synonyms
   (exact, related, alternative labels) with their references, `is_a` parents, relations (part of, attached to, …),
   obsolete status and replacement, notes, cross-references and contributors. Relation names come from the
   `[Typedef]` stanzas. "Has part" and "more specific terms" are worked out by reversing "part of" and "is a".
3. **Recognises the references** on each synonym and definition: either an old address
   (`http://api.hymao.org/api/ref/68598`) or a TaxonWorks address
   (`https://sfg.taxonworks.org/api/v1/sources/44001`).
4. **Reads TaxonWorks** (`/sources?in_project=true&extend[]=identifiers`) with the HAO project token, which is a
   public read-only token kept in `explorer.config.json`, as TaxonPages does. Each TaxonWorks source that carries an
   old hymao address as a Global → URI identifier replaces the old citation of that number. TaxonWorks writes that
   identifier into its citation text ("Available at http://api.hymao.org/…"); the script removes that phrase.
   Sources not cited by the ontology are kept too (shown as "not cited yet").
5. **Reads the groups**: the citations of sources on OTUs or taxon names in the HAO project (`/citations`, then
   `/otus/:id` and `/taxon_names/:id`), so each reference knows which groups it covers (e.g. Lacaze-Duthiers 1849 →
   Chrysididae, pp. 372–374).
6. **Reads the releases** (`scripts/releases.mjs`): the GitHub releases of hao2, plus HAO 2.0.0 (2026-02-12) as the
   starting point. For each it downloads `hao.obo` at that tag (kept in `.cache/releases/`, since releases never
   change) and compares it with the previous one: new, obsolete and renamed terms, changed definitions, synonyms
   added or removed, references newly cited from TaxonWorks.
7. **Writes `public/data/hao.json`** with short keys to keep it small (`n` name, `d` definition, `s` synonyms,
   `r` relations …).

If TaxonWorks or GitHub cannot be reached, the script says so and the site still works with the ontology alone.

## 5. The pages

| Page | Address | What it shows | Main file |
|---|---|---|---|
| Start | `#/` | Title, large search, and the **map of the body**: a zoomable sunburst of the 1,803 parts under head, mesosoma and abdomen (rings = levels of "part of", size = number of parts inside), with a side panel | `HomeView.vue`, `components/OntologyMap.vue`, `lib/anatomyTree.js` |
| Term | `#/term/HAO_0000576` | Definition and source, synonyms with their literature, relations, network of connections, names by group, identifiers, how to cite, print/PDF | `TermView.vue`, `components/RefList.vue`, `TermChips.vue`, `TermNetwork.vue` |
| References | `#/references` | Counters (how many linked to TaxonWorks), groups, the **timeline** "Two centuries of names" (each work by year and body region; pointing at one draws its links to works naming the same parts), and the filterable list | `ReferencesView.vue`, `components/ReferenceTimeline.vue` |
| Reference | `#/ref/tw44001` or `#/ref/68598` | The citation, its groups, every term and synonym citing it, links (online copy, TaxonWorks, old address) | `RefView.vue` |
| Group | `#/group/tn1658715` | Works about the group and the names they use; glossary download (CSV); print | `GroupView.vue` |
| Compare | `#/compare?a=…&b=…` | Names two groups use for the same parts, side by side; CSV | `CompareView.vue` |
| Releases | `#/releases` | Every version with notes, downloads and the changes found automatically | `ReleasesView.vue` |
| Statistics | `#/statistics` | Key numbers, terms by origin, references by decade, synonyms by kind, groups; CSV and print | `StatsView.vue` |
| About | `#/about` | What HAO is, how it is built, editors (read from the ontology), how to cite, how to contribute | `AboutView.vue` |

Shared pieces: `App.vue` (header with search, menu and white/black switch; footer), `lib/hao.js` (loading the data,
search, short reference labels like "Vilhelmsen et al. 2010", links, groups, CSV download), `lib/theme.js`
(white/black, remembered in the browser), `style.css` (all colours, layout and the print style).

**Search** looks through every term name and every synonym, ranking exact matches first, then names starting with
the text, then words inside, and Hymenoptera-specific (HAO) terms before general ones.

## 6. How it was built, step by step

1. **A single-file pilot** (`archive/hao-explorer-pilot.html`) to see the idea: search, term page, synonyms with
   references, an image with outlined parts, and a network of connections. The old HAO bibliography (all 469
   references) was fetched once from api.hymao.org and saved.
2. **The Vue project**, with the data script, term pages and the network. Published to GitHub as hao-explorer.
3. **TaxonWorks references**: reading the HAO project, matching old hymao numbers through URI identifiers, the
   References and Reference pages, then the token in the config file (TaxonPages style).
4. **New look**: the photo-centred design was dropped for the **map of the ontology**, a large central search,
   menu on the right, white/black switch, and the name "Hymenoptera Anatomy Ontology".
5. **The references timeline**, to show the literature and its connections.
6. **Moving references to TaxonWorks in the ontology**: `scripts/hymao-to-taxonworks.mjs`
   (`npm run references` / `npm run references:update`) replaces old addresses in `hao-edit.owl` with TaxonWorks
   ones for every linked source. First used for 6 references (19 citations), released as HAO 2.1.0.
7. **Folder reorganisation** under `GitHub\HAO` (hao2, hao-explorer, archive).
8. **Releases page** with automatic comparison of versions, and the version naming (HAO 2.x.y, see MAKING-A-RELEASE.md).
9. **Groups** from TaxonWorks OTU citations: group pages, names by group, group labels on references.
10. **Wider layout and footer**, then **compare groups, glossary export, print/PDF, About and Statistics**.

## 7. Decisions worth remembering

- **The ontology stays group-neutral.** Which group a work dealt with lives in TaxonWorks, not in HAO.
- **Old reference numbers are never lost**: they stay on the TaxonWorks sources as URI identifiers, so old releases
  can still be matched.
- **Release dates are the official versions** (`v2026-11-01`, used by OLS); the names (HAO 2.1.0) are for people.
- **One command per task** (`npm run dev`, `npm run references`, `npm run references:update`), and a written guide for
  each task.
- **The project token is public** (TaxonWorks lists it for open projects), so it is in the config file; no other
  secrets are needed.
- **Nothing is edited by hand that a script can do**, and every script first shows what it would change.

## 8. Running, building and publishing

```
npm install          # once, or after package.json changes
npm run dev          # prepare the data, then the site at http://localhost:5173
npm run build        # the finished site in dist/
```

Online: `.github/workflows/deploy.yml` builds and publishes the site on GitHub Pages on every push to main, every
Monday (to pick up new releases and TaxonWorks changes), and on demand (Actions → Deploy to GitHub Pages → Run
workflow). Address: https://davidedalpos.github.io/hao-explorer/

## 9. How it was tested

During development each change was built and opened in a headless browser (Playwright): pages loaded without errors,
screenshots checked in light and black themes and at phone width (no sideways scrolling), downloads and print-to-PDF
tried. TaxonWorks and GitHub answers were checked against the real HAO project and the real HAO 2.1.0 release.

## 10. Where to change things

| To change | Edit |
|---|---|
| Where the ontology, TaxonWorks or releases come from | `explorer.config.json` |
| What is read from the ontology or TaxonWorks | `scripts/build-data.mjs`, `scripts/releases.mjs` |
| Colours, sizes, fonts, print style | `src/style.css` |
| Header, menu, footer | `src/App.vue` |
| A page | the matching file in `src/views/` |
| Body regions on the map | `BRANCHES` in `src/lib/anatomyTree.js` |
| Labelled figures (images with outlined parts) | `src/lib/figures.js` and `public/images/` |
