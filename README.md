# HAO Explorer

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
| Full citations of the references | `data/hymao-refs.json` (the old HAO bibliography, api.hymao.org); later the TaxonWorks HAO project |
| Images | `src/lib/figures.js` (labelled figures, each part linked to its term); later TaxonWorks images |

The build looks for `hao.obo` in the places listed in `explorer.config.json` (`../hao.obo` when this folder
sits inside the hao2 repository, `../target/hao2/hao.obo` in the Ontology working folder), and downloads it
from `ontologyUrl` if it finds none. The result is `public/data/hao.json`, which is generated and not committed.

## How the project is organised

| Path | What it does |
|---|---|
| `scripts/build-data.mjs` | Reads `hao.obo` and writes `public/data/hao.json` (terms, synonyms, relations, references) |
| `src/lib/hao.js` | Loads the data; search, short reference labels, links, breadcrumb |
| `src/lib/figures.js` | Labelled specimen figures and the start-page region shortcuts |
| `src/views/HomeView.vue` | Start page: clickable specimen, counts, body regions |
| `src/views/TermView.vue` | A term: definition, synonyms and their literature, relations, network, image, identifiers, citation |
| `src/components/` | Search box, specimen figure, reference list, term chips, network of connections |
| `src/style.css` | Colours, type and layout (light and dark themes) |

Links to a term look like `#/term/HAO_0000575`, so they can be shared and work on any static host.

## Planned

- References and images from the TaxonWorks HAO project, so new ones appear without rebuilding the site.
- Automatic rebuild and publishing on GitHub Pages whenever a new ontology release is made.

## Add a labelled figure

Put the image in `public/images/`, then add an entry to `FIGURES` in `src/lib/figures.js`: the image size,
a caption and credit, and for each part its HAO term, a label, and its outline as an SVG path drawn on the
image's own pixel grid. The term pages pick it up automatically.

## Publish

```
npm run build    # the finished site is in dist/
```

`dist/` can be served from GitHub Pages (a deploy workflow can be added later) or any static host.
