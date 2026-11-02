<template>
  <nav
    class="crumbs"
    aria-label="Where this page sits"
  >
    <RouterLink to="/">Home</RouterLink>
  </nav>

  <article class="about">
    <h1 class="page-title">About the Hymenoptera Anatomy Ontology</h1>
    <p class="about-lede">
      The Hymenoptera Anatomy Ontology (HAO) is a shared, structured vocabulary for the anatomy of wasps, bees, ants and
      sawflies. Each anatomical concept has a permanent identifier, a definition, its place among the other parts, and
      the names it has carried in the literature, each traced to the work that used it.
    </p>

    <section>
      <h2 class="sec">Why it exists</h2>
      <p>
        The same structure has often been given many names, and the same name used for different structures, across
        groups, languages and two centuries of literature. HAO gives each concept one identifier and one definition, so
        that descriptions, character matrices and databases can say exactly which part they mean, and data from
        different works can be compared and combined.
      </p>
    </section>

    <section>
      <h2 class="sec">How it is built</h2>
      <ul class="about-list">
        <li>
          <b>HAO2</b> is the current generation of the ontology. It is maintained with the
          <a href="https://github.com/INCATools/ontology-development-kit">Ontology Development Kit (ODK)</a>, which checks
          every release, and published through the <a href="https://obofoundry.org">OBO Foundry</a> and the
          <a href="https://www.ebi.ac.uk/ols4/ontologies/hao">Ontology Lookup Service</a>.
        </li>
        <li>
          It sits under the <a href="https://github.com/insect-morphology/aism">Insect Skeleto-Muscular Ontology
          (AISM)</a>: general concepts such as sclerite, conjunctiva or articulation come from AISM and are shared with
          other insect orders; terms specific to Hymenoptera have <span class="mono">HAO:</span> identifiers.
        </li>
        <li>
          The <b>references</b> (and, soon, images) are kept in the HAO project in
          <a href="https://taxonworks.org">TaxonWorks</a>, where citations are curated and linked to the groups they
          deal with. This website reads both the ontology and TaxonWorks.
        </li>
        <li>
          Each version is listed on the <RouterLink to="/releases">Releases</RouterLink> page with what changed; the
          current one is <b>{{ hao.release || 'release' }} ({{ hao.version }})</b>.
        </li>
      </ul>
    </section>

    <section>
      <h2 class="sec">Editors and contributors</h2>
      <ul class="about-people">
        <li
          v-for="p in hao.contributors || []"
          :key="p.name"
        >
          {{ p.name }}
          <a
            v-if="p.orcid"
            :href="p.orcid"
            class="muted mono"
          >ORCID</a>
        </li>
      </ul>
      <p class="muted">
        and the many hymenopterists who contributed terms, definitions and references over the years.
      </p>
    </section>

    <section>
      <h2 class="sec">How to cite</h2>
      <p>Please cite the ontology and the release you used:</p>
      <blockquote class="cite">
        Yoder MJ, Mikó I, Seltmann KC, Bertone MA, Deans AR (2010) A gross anatomy ontology for Hymenoptera.
        <i>PLoS ONE</i> 5(12): e15991. <a href="https://doi.org/10.1371/journal.pone.0015991">https://doi.org/10.1371/journal.pone.0015991</a>
      </blockquote>
      <blockquote class="cite">
        Hymenoptera Anatomy Ontology (HAO), {{ hao.release ? hao.release + ', ' : '' }}release {{ hao.version }}.
        http://purl.obolibrary.org/obo/hao.owl
      </blockquote>
      <p>
        Single terms can be cited from their pages ("Cite this term"). Terms, definitions and relations are available
        under <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>.
      </p>
    </section>

    <section>
      <h2 class="sec">Contribute</h2>
      <p>
        Corrections, new terms, new synonyms and references are welcome. Open an issue in the
        <a href="https://github.com/DavideDalPos/hao2/issues/new/choose">HAO2 issue tracker</a>, giving the term, a
        definition, a reference and the parent term you suggest.
      </p>
    </section>
  </article>
</template>

<script setup>
import { onMounted } from 'vue'
import { hao } from '../lib/hao.js'

onMounted(() => (document.title = 'About — Hymenoptera Anatomy Ontology'))
</script>
