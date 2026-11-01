// Labelled specimen figures. Each part is an outline traced on the image
// (in the image's own pixel grid, here 891 × 561) and tied to its HAO term.
// Add a figure by adding an entry; later these can come from TaxonWorks images.
export const FIGURES = [
  {
    id: 'protoleptops',
    image: 'images/protoleptops-habitus.jpg',
    width: 891,
    height: 561,
    caption: 'Protoleptops farquharsoni, female, lateral view',
    credit: 'Dal Pos et al. 2024, ZooKeys 1214, fig. 2A, CC BY 4.0',
    parts: [
      { term: 'HAO:0000101', label: 'Antenna', d: 'M0 256 L60 258 L105 266 L128 276 L124 294 L100 288 L60 284 L0 306 Z', dot: [62, 270], tx: 30, ty: 204 },
      { term: 'HAO:0000217', label: 'Compound eye', d: 'M128 262 L134 240 L152 230 L170 240 L176 264 L172 292 L156 306 L138 298 L128 280 Z', dot: [152, 252], tx: 168, ty: 140 },
      { term: 'HAO:0000397', label: 'Head', d: 'M118 262 L124 240 L148 226 L180 232 L204 252 L214 290 L238 330 L236 356 L214 368 L190 360 L164 332 L136 312 L118 290 Z', dot: [206, 318], tx: 150, ty: 526 },
      { term: 'HAO:0000576', label: 'Mesosoma', d: 'M204 252 L214 232 L250 222 L296 230 L326 250 L336 292 L392 296 L418 320 L420 374 L396 396 L352 402 L318 388 L282 386 L252 372 L236 332 L214 290 Z', dot: [330, 340], tx: 300, ty: 526 },
      { term: 'HAO:0001089', label: 'Wing', d: 'M318 242 L380 196 L460 150 L560 100 L640 68 L720 48 L806 56 L852 116 L836 180 L724 252 L634 302 L530 328 L430 338 L372 304 L334 266 Z', dot: [600, 190], tx: 470, ty: 34 },
      { term: 'HAO:0000626', label: 'Metasoma', d: 'M420 374 L436 350 L480 340 L530 342 L620 350 L690 370 L748 400 L800 430 L826 456 L824 478 L796 474 L744 448 L686 428 L622 400 L560 388 L500 380 L452 394 Z', dot: [700, 400], tx: 700, ty: 324 },
      { term: 'HAO:0000494', label: 'Leg', d: 'M128 314 L146 322 L118 362 L88 412 L58 437 L-2 470 L-12 472 L-12 458 L48 424 L78 392 L106 350 Z M148 356 L193 360 L193 378 L158 378 L128 404 L98 450 L38 488 L-12 506 L-12 492 L28 474 L80 436 L108 394 Z M380 410 L400 400 L470 396 L515 392 L530 402 L612 468 L700 505 L778 540 L770 552 L690 520 L600 486 L520 420 L470 414 L400 422 Z M440 432 L470 425 L560 428 L690 440 L891 488 L891 522 L690 468 L560 462 L470 458 L440 450 Z', dot: [580, 452], tx: 560, ty: 544 }
    ]
  }
]

// Figures and the part that shows a given term
export function figuresFor(termId) {
  const out = []
  for (const f of FIGURES) {
    const part = f.parts.find((p) => p.term === termId)
    if (part) out.push({ figure: f, part })
  }
  return out
}

// Start-page shortcuts
export const REGIONS = [
  ['HAO:0000397', 'Head'], ['HAO:0000101', 'Antenna'], ['HAO:0000576', 'Mesosoma'], ['HAO:0001089', 'Wing'],
  ['HAO:0000494', 'Leg'], ['HAO:0000626', 'Metasoma'], ['HAO:0000679', 'Ovipositor'], ['HAO:0000015', 'Abdomen'], ['HAO:0000575', 'Mesoscutum']
]
