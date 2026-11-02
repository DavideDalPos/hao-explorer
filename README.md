# Hymenoptera Anatomy Ontology — website

The code of the **Hymenoptera Anatomy Ontology** website (this repository: `hao-explorer`).

A friendly interface to the **Hymenoptera Anatomy Ontology (HAO)** for taxonomists, students and the public:
search a term or any of its old names, read its definition, see every synonym with the works that used it,
where the part sits on the body, images of it, and a network of its connections to other parts.

Built with Vue 3 and Vite. The site is static: it can be hosted on GitHub Pages or any web server.

## Run it on your computer

You need [Node.js](https://nodejs.org) 20 or newer.

```
npm install      # once
npm run dev      # then open http://localhost:5173
```

`npm run dev` first rebuilds the data from the ontology, then starts the site. Changes to the code show up
in the browser as you save.

## Where the data comes from

| What | Source |
|---|---|
| Terms, definitions, synonyms, relations | The HAO release `hao.obo`, read by `scripts/build-data.mjs` |
| References | The HAO project in TaxonWorks (sfg.taxonworks.org), read through its API; `data/hymao-refs.json` (the old HAO bibliography) for those not linked yet |
| Images | `src/lib/figures.js` (labelled figures, each part linked to its term); later TaxonWorks images |

The build reads `hao.obo` from the hao2 repository next to this folder (`../hao2/hao.obo`, as set in
`explorer.config.json`), and downloads it from `ontologyUrl` if it is not there (as on GitHub). The result is
`public/data/hao.json`, which is generated and not committed.

## References from TaxonWorks

The ontology cites references by their old HAO address, e.g. `http://api.hymao.org/api/ref/68598`. To link one to
TaxonWorks, add the source to the HAO project and give it that address as a **Global → URI** identifier. The
explorer then shows the TaxonWorks citation, links, and a reference page. The **References** page shows how many are
linked so far, and which are not.

TaxonWorks is read with the HAO project token in `explorer.config.json` (`taxonworks.project_token`). It is a
public, read-only token, the same kind TaxonPages keeps in its config. Nothing else to set up: `npm run dev`.

To replace the old addresses in the ontology with TaxonWorks addresses, follow
[UPDATING-REFERENCES.md](UPDATING-REFERENCES.md) (`npm run references`, then `npm run references:update`).

## How-to guides

| Guide | When |
|---|---|
| [MAKING-A-RELEASE.md](MAKING-A-RELEASE.md) | Releasing a new version of HAO (ODK), naming it (HAO 2.x.y), and seeing it on the site |
| [ADDING-REFERENCES.md](ADDING-REFERENCES.md) | Attaching a new reference to a term or a synonym (TaxonWorks + Protégé) |
| [UPDATING-REFERENCES.md](UPDATING-REFERENCES.md) | Moving the old HAO references to TaxonWorks, in batches |
| [HOW-IT-WAS-BUILT.md](HOW-IT-WAS-BUILT.md) | How the website works and was built: data sources, scripts, pages, decisions |

## How the project is organised

| Path | What it does |
|---|---|
| `scripts/build-data.mjs` | Reads `hao.obo` and writes `public/data/hao.json` (terms, synonyms, relations, references) |
| `src/lib/hao.js` | Loads the data; search, short reference labels, links, breadcrumb |
| `src/lib/figures.js` | Labelled specimen figures and the start-page region shortcuts |
| `src/views/HomeView.vue` | Start page: clickable specimen, counts, body regions |
| `src/views/ReferencesView.vue`, `RefView.vue` | All references (with how many are linked to TaxonWorks), and one reference with the terms that cite it |
| `src/views/TermView.vue` | A term: definition, synonyms and their literature, relations, network, image, identifiers, citation |
| `src/components/` | Search box, specimen figure, reference list, term chips, network of connections |
| `src/style.css` | Colours, type and layout (light and dark themes) |

Links to a term look like `#/term/HAO_0000575`, so they can be shared and work on any static host.

## Planned

- Images from the TaxonWorks HAO project, tagged with the HAO term they show.

## Add a labelled figure

Put the image in `public/images/`, then add an entry to `FIGURES` in `src/lib/figures.js`: the image size,
a caption and credit, and for each part its HAO term, a label, and its outline as an SVG path drawn on the
image's own pixel grid. The term pages pick it up automatically.

## Publish

```
npm run build    # the finished site is in dist/
```

Online, the site is built and published automatically on GitHub Pages by `.github/workflows/deploy.yml`:
on every push to `main`, every Monday (to pick up a new hao2 release), and on demand from the Actions tab.
The live site is at <https://davidedalpos.github.io/hao-explorer/>.
