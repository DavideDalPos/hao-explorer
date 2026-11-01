# Making a release of HAO

A **release** turns the editors' file (`src/ontology/hao-edit.owl`) into the official files everyone uses
(`hao.owl`, `hao.obo`, `hao-base.*`, `hao-full.*`), after checking it. The **ODK** (Ontology Development Kit) does
this, inside Docker. Then you push, and publish the release on GitHub so it has a name and a permanent copy.
The website shows every release and what changed, by itself.

Everything below is in **PowerShell**. Docker Desktop must be running.

## 1. Make the release (ODK)

```
cd C:\Users\davel\Desktop\Archive\GitHub\HAO\hao2\src\ontology
.\run.bat make prepare_release
```

It takes a few minutes. It writes the new release files in the main hao2 folder, with today's date as the version
(`data-version: releases/2026-11-01` inside `hao.obo`). It also fetches the newest AISM, so `hao-full.*` and the
`imports` folder change too; that is normal.

If it stops with an error, nothing is published: copy the last lines of the output and fix the problem it names
(often a term without a label or definition, or a broken reference to another term).

## 2. Push to GitHub

If you worked on a branch (recommended):

```
cd C:\Users\davel\Desktop\Archive\GitHub\HAO\hao2
git status
git add -A
git commit -m "Release 2026-11-01: <what changed, in a few words>"
git push -u origin <branch name>
git checkout main
git merge <branch name>
git push
```

("LF will be replaced by CRLF" warnings are harmless.)

## 3. Publish the release on GitHub (one minute)

1. Go to https://github.com/DavideDalPos/hao2/releases/new
   (or: hao2 on GitHub → right column **Releases** → **Create a new release**).
2. **Choose a tag** → type `v` + the release date, e.g. `v2026-11-01` → **Create new tag on publish**.
   Target: **main**.
3. **Release title:** the version name and the date, e.g. `HAO 2.1.0 (2026-11-01)`.
4. **Describe this release:** one or two lines in plain words, e.g. "6 references moved to TaxonWorks."
5. **Publish release**.

### Which version number?

HAO 2 releases are numbered **2.x.y**:

| What changed | Change | Example |
|---|---|---|
| Terms added, renamed, made obsolete, definitions or relations changed | middle number, last back to 0 | 2.1.0 → **2.2.0** |
| Only small fixes: references, typos, synonyms | last number | 2.1.0 → **2.1.1** |
| A new generation of the ontology | first number | 2.x → **3.0.0** |

The date (`v2026-11-01`) stays the official version inside the files; OLS and other tools use it. The number is
the human name.

So far: **HAO 2.0.0** (2026-02-12, the first HAO2 release) and **HAO 2.1.0** (2026-11-01).

## 4. The website

- On your computer: `npm run dev` in `GitHub\HAO\hao-explorer`. The **Releases** page lists the new release with
  what changed since the previous one (new terms, obsolete terms, renamed terms, changed definitions, synonyms,
  references moved to TaxonWorks), each linked to its page. The footer shows the current version.
- Online: the site rebuilds every Monday, or right away from hao-explorer on GitHub → **Actions** →
  **Deploy to GitHub Pages** → **Run workflow**.

## 5. OLS

The Ontology Lookup Service reads new releases on its own, from the address HAO is registered with at the OBO
Foundry. Check that it points to DavideDalPos/hao2 (or wherever the official HAO2 releases are).
