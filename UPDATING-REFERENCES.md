# Updating the references (hymao → TaxonWorks)

The ontology cites its references by address. The old addresses (`http://api.hymao.org/api/ref/68598`) are being
replaced by TaxonWorks addresses (`https://sfg.taxonworks.org/api/v1/sources/44001`). Do this in batches, whenever
you have linked some references in TaxonWorks. Running it again is always safe: it only changes what is newly linked.

## 1. In TaxonWorks (HAO project)

For each reference:

1. Find the source (or create it) and add it to the HAO project.
2. Radial annotator → **Identifiers** → **Global → URI**, paste the old address, e.g. `http://api.hymao.org/api/ref/68598`.
3. Leave the **URL** field for a real link (BHL, archive.org, publisher), or empty. Never the hymao address.

Which ones are left: the **References** page of the site ("Not linked yet"), or `hymao-to-taxonworks-report.csv`
(made by step 2, sorted by how often each is cited).

## 2. Update the ontology (PowerShell)

```
cd C:\Users\davel\Desktop\Archive\GitHub\HAO\hao2
git checkout main
git pull
git checkout -b references-update

cd C:\Users\davel\Desktop\Archive\GitHub\HAO\hao-explorer
npm run references            # shows what would change, changes nothing
npm run references:update     # changes hao-edit.owl
```

## 3. Make the release (PowerShell, Docker Desktop running)

```
cd C:\Users\davel\Desktop\Archive\GitHub\HAO\hao2\src\ontology
.\run.bat make prepare_release
```

## 4. Push hao2 (PowerShell)

```
cd C:\Users\davel\Desktop\Archive\GitHub\HAO\hao2
git status
git add -A
git commit -m "References linked to TaxonWorks"
git push -u origin references-update
```

Then on GitHub: open the pull request for `references-update` and merge it. Check the pull request page says
**base repository: DavideDalPos/hao2**, base: main (GitHub suggests insect-morphology/hao2 by default, because
hao2 is a fork of it).

## 4b. Publish the release on GitHub

hao2 on GitHub → **Releases** → **Create a new release** (tag `v` + date, title `HAO 2.1.1 (date)`, one line of
notes). Details and version numbers: [MAKING-A-RELEASE.md](MAKING-A-RELEASE.md).

## 5. Check the site

```
cd C:\Users\davel\Desktop\Archive\GitHub\HAO\hao-explorer
npm run dev
```

The first lines say how many references are cited by their TaxonWorks address. The online site picks up the new
release by itself at its next build (every Monday, or Actions → Run workflow).
