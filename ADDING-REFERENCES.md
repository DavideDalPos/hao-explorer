# Adding a new reference to a term or a synonym

Use this when you find a work that defines a term, or that uses a name for a part (a synonym), and you want the
ontology to cite it. It needs two places: **TaxonWorks** (the reference itself) and the **ontology file** (where the
reference is attached to the term).

For moving the *old* HAO references to TaxonWorks, see [UPDATING-REFERENCES.md](UPDATING-REFERENCES.md) instead.

## 1. TaxonWorks: the reference

1. In the **HAO** project on sfg.taxonworks.org, find the source (search first: sources are shared by all projects,
   so it may already exist) or create it. Make sure it is added to the HAO project.
2. Note its **ID**, the number in its page address, e.g. **253350** for Ross 1956.
3. Its address for the ontology is then:

   `https://sfg.taxonworks.org/api/v1/sources/253350`

   (replace the number). Open it in a browser to check: it shows the record of that source.

## 2. The ontology: attach the reference

The file is `src/ontology/hao-edit.owl` in the hao2 folder
(`C:\Users\davel\Desktop\Archive\GitHub\HAO\hao2\src\ontology\hao-edit.owl`).
Open it in **Protégé** (free ontology editor, https://protege.stanford.edu). Work on a new branch of hao2
(see step 0 below).

**A new synonym, with its reference**

1. Find the term (search box at the top of the class hierarchy), e.g. *mesosoma*.
2. In the **Annotations** panel, click **+**.
3. Choose the kind of synonym:
   - `has_exact_synonym`: means exactly the same part,
   - `has_related_synonym`: used for the part, but not exactly the same meaning (most old names are this),
   - `has_broad_synonym` / `has_narrow_synonym`: broader or narrower than the term.
4. Type the name, e.g. `thoracic trunk`, and click OK.
5. Click the small **@** next to the new synonym, then **+**, choose `database_cross_reference`
   (shown as `hasDbXref`), and paste the TaxonWorks address. OK.

**A reference for the definition**

1. Find the term, and in the Annotations panel find its **definition**.
2. Click the **@** next to the definition, then **+**, `database_cross_reference`, paste the TaxonWorks address. OK.

**Save** (File → Save). Keep the format Protégé proposes.

What it looks like in the file (you do not need to edit the file by hand, this is only to recognise it):

```
AnnotationAssertion(Annotation(oboInOwl:hasDbXref "https://sfg.taxonworks.org/api/v1/sources/253350") oboInOwl:hasRelatedSynonym obo:HAO_0000576 "thoracic trunk")
```

## 3. Release, push, and see it on the site

Follow [MAKING-A-RELEASE.md](MAKING-A-RELEASE.md). In short:

0. **Before editing**, start a branch (PowerShell):
   ```
   cd C:\Users\davel\Desktop\Archive\GitHub\HAO\hao2
   git checkout main
   git pull
   git checkout -b new-synonyms
   ```
1. Edit and save in Protégé (above).
2. Make the release, push, merge, publish the GitHub release (MAKING-A-RELEASE.md).
3. `npm run dev` in hao-explorer: the term page shows the new synonym with its reference, and the Releases page
   lists it under "synonyms added".

## Linking a reference to a group (Ichneumonidae, Apidae…)

The ontology itself stays group-neutral. Which group a work dealt with is recorded in TaxonWorks, and the website
shows it: a page per group with its works and the names they use, "Names by group" on each term page, and the group
next to each reference.

In the HAO project in TaxonWorks:

1. Make sure the group exists as an **OTU** (linked to its taxon name, e.g. Chrysididae). Create it if needed.
2. Open the OTU (Browse OTUs), click the **radial annotator** → **Citations** → find the source → add it, with the
   pages if useful (e.g. `372-374`). A citation on the taxon name (Browse nomenclature) works too.
3. That's all: restart `npm run dev` (or wait for the next online build) and the group appears on the References
   page under "By group".

Example: Lacaze-Duthiers 1849 → Chrysididae, pp. 372–374.

## Many at once

For many synonyms or references at once (a list from a paper, say), Protégé is slow. A spreadsheet with the columns
`term ID, synonym, type (exact/related), TaxonWorks source ID` and one command that adds all the rows to
`hao-edit.owl` can be added to the website project on request.
