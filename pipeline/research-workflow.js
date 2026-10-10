export const meta = {
  name: 'anatomy-content-research',
  description: 'Section agents research anatomy content, reviewer checks, scorer gates at 9/10 with regeneration',
  phases: [
    { title: 'Research', detail: 'one agent per body system writes cited content' },
    { title: 'Review', detail: 'medical reviewer checks each section' },
    { title: 'Score', detail: 'strict scorer, pass >= 9/10, else regenerate' },
    { title: 'Final review', detail: 'cross-section consistency check' },
  ],
}

const ROOT = 'C:\\Users\\SDF 01\\Downloads\\3D_Human'
const SECTIONS = [
  { key: 'skeleton', title: 'Skeletal system (bones, cartilage, teeth)', target: '45-60', hint: 'Major bones every educated adult may meet: skull bones (frontal, parietal, temporal, occipital, mandible, maxilla, zygomatic, nasal...), vertebrae groups, sternum, ribs, clavicle, scapula, humerus, radius, ulna, carpals/metacarpals/phalanges groups, hip bone, sacrum, coccyx, femur, patella, tibia, fibula, tarsals incl. talus & calcaneus, metatarsals, teeth groups, costal cartilage.' },
  { key: 'muscles', title: 'Muscular system (skeletal muscles)', target: '45-60', hint: 'Well known muscles: deltoid, biceps brachii, triceps, pectoralis major/minor, trapezius, latissimus dorsi, rectus abdominis, obliques, gluteus maximus/medius, quadriceps parts, hamstrings, gastrocnemius, soleus, tibialis anterior, sternocleidomastoid, masseter, temporalis, orbicularis oculi/oris, diaphragm, rotator cuff, serratus anterior, forearm flexors/extensors groups, adductors, sartorius, iliopsoas etc. Diaphragm may be present.' },
  { key: 'arteries', title: 'Arteries (incl. pulmonary arteries)', target: '25-35', hint: 'Aorta parts, coronary arteries if present, carotids, subclavian, vertebral, brachial, radial, ulnar, celiac trunk, mesenterics, renal, iliacs, femoral, popliteal, tibials, dorsalis pedis, pulmonary trunk/arteries, cerebral arteries (circle of Willis). Note pulmonary arteries carry deoxygenated blood.' },
  { key: 'veins', title: 'Veins (incl. pulmonary veins)', target: '20-30', hint: 'Superior/inferior vena cava, jugular veins, subclavian, brachiocephalic, cephalic, basilic, median cubital (blood draw), azygos, hepatic portal vein if present, renal, iliac, femoral, great saphenous, small saphenous, popliteal, pulmonary veins, dural sinuses.' },
  { key: 'organs', title: 'Internal organs (heart, brain, lungs, digestive, urinary, reproductive (male), endocrine, eyes, spleen, thymus)', target: '40-55', hint: 'Heart chambers/valves, brain lobes, cerebellum, brainstem, eyes, lungs, trachea, bronchi, oesophagus, stomach, liver, gallbladder, pancreas, small intestine parts, colon parts, appendix, rectum, kidneys, ureters, bladder, prostate, testes, thyroid, adrenal glands, spleen, thymus, salivary glands, tongue if present.' },
  { key: 'nerves', title: 'Nerves (peripheral nervous system, cranial nerves, spinal nerves, plexuses)', target: '20-30', hint: 'Cranial nerves I-XII as present (optic, trigeminal, facial, vagus...), brachial plexus, median, ulnar, radial, musculocutaneous, axillary, phrenic, intercostal, lumbar plexus, femoral, sciatic, tibial, common fibular, sympathetic trunk if present.' },
  { key: 'skin', title: 'Skin & integument (skin surface regions, nails)', target: '10-15', hint: 'Skin as an organ (layers epidermis/dermis/hypodermis described in text), nails, main body surface regions present (face, scalp/epicranium, neck, thorax, abdomen, back, upper limb, hand, palm, lower limb, foot, sole, ear/auricle). Match region objects appropriately.' },
  { key: 'doctor', title: 'Doctor assistant knowledge base: system overviews + FAQ', target: 'n/a', hint: 'special' },
]

const ENTRY_SPEC = `
Write a JSON file at ${ROOT}\\content\\{KEY}.json (UTF-8) with this exact shape:
{
  "layer": "{KEY}",
  "overview": { "title": str, "summary": str (2-3 sentences), "function": str, "facts": [str, str], "sources": [url,...] },
  "structures": [
    {
      "id": "kebab-case-unique",
      "medical": "Official anatomical name (English, Terminologia Anatomica style, e.g. 'Biceps brachii muscle')",
      "common": "Common everyday name a non-medical adult uses (e.g. 'Biceps'); if none exists, a short plain-English descriptor (e.g. 'Upper arm bone'). Never invent slang.",
      "category": "sub-group, e.g. 'Skull', 'Upper limb', 'Thigh'",
      "match": ["EXACT object names copied from the names file"],
      "summary": "2-3 sentences, level: an educated adult / first-year medical student, plain but correct",
      "function": "1-2 sentences what it does",
      "location": "1 sentence where it is, relative to landmarks",
      "facts": ["1-2 short interesting, VERIFIED facts"],
      "sources": ["2+ URLs you actually opened"]
    }
  ],
  "commonNames": { "Exact object name": "common name", ... }  // OPTIONAL extra common names for other objects in the names file that have a genuine widely-used common name
}
RULES:
- The 3D model's objects are listed in ${ROOT}\\content\\names\\{KEY}.txt (one per line: name<TAB>[group]<TAB>[mat]). "match" entries MUST be copied exactly from the first column. Include BOTH left (.l) and right (.r) objects for paired structures; include all sub-part objects that form the structure (e.g. all heads of a muscle, all segments of a vessel with the same name). Only use names that exist.
- Pick ${'{TARGET}'} structures that matter most for a medical student / educated layperson. Quality over quantity. Do NOT go into deep detail.
- RESEARCH EVERY CLAIM. Do not rely on memory. Use WebSearch/WebFetch on trusted sources: Kenhub, TeachMeAnatomy, NCBI StatPearls/Bookshelf, MedlinePlus, Cleveland Clinic, Mayo Clinic, NIH/NCI SEER training, Radiopaedia, Britannica, Gray's Anatomy (Bartleby), Wikipedia only as secondary. Every structure needs 2+ source URLs that you opened. Numbers (counts, sizes, lengths) must match sources.
- Wording must be your own (no copying sentences from sources).
- SAVE PROGRESS: write the file early and update it every ~8 structures, so partial work is never lost. If the file already exists (from an interrupted run), read it and continue from it instead of starting over.
- After writing, validate with Python: parse the JSON, check every "match" name exists in the names file, ids unique, required fields present. Fix until valid.
Return a short plain-text summary: number of structures, file path, any caveats.`

const DOCTOR_SPEC = `
You are writing the knowledge base for a cute cartoon 3D doctor assistant on an anatomy website (adult male model; layers: skeleton, muscles, arteries, veins, organs, nerves, skin). Audience: medical students / educated adults.
Write ${ROOT}\\content\\doctor.json:
{
  "layer": "doctor",
  "systems": [ { "id": "skeletal|muscular|circulatory|nervous|respiratory|digestive|urinary|reproductive-male|endocrine|lymphatic-immune|integumentary", "title": str, "summary": str (3-4 sentences), "keyFacts": [3 verified facts], "keywords": [search keywords], "sources": [urls] } ],
  "faq": [ { "q": "question a student might ask", "a": "2-4 sentence answer, friendly doctor voice, correct", "keywords": [..], "sources": [urls] } ]   // 40-60 FAQ: e.g. how many bones in adult body, strongest muscle, how blood circulates, arteries vs veins colour convention and why pulmonary arteries carry deoxygenated blood, what does the liver do, largest organ, how long is small intestine, how fast nerves conduct, why skin colour differs, how many teeth adults have, etc.
  "colorConventions": { "arteries": hex, "veins": hex, "pulmonaryArteries": hex, "pulmonaryVeins": hex, "nerves": hex, "bone": hex, "muscle": hex, "note": "research what colours standard anatomy atlases (e.g. Netter, Gray's, Sobotta) and medical illustration conventions use for arteries/veins/nerves/lymph and cite", "sources": [urls] },
  "lines": { "greetings": [5 cheerful short lines], "clickReactions": [5 lines like 'Oh-ho! What do you want to know? Ask me anything!'], "idleSleeping": [3], "idleStudying": [3], "idleEating": [3 short lines e.g. about a healthy snack], "dontKnow": [3 polite lines suggesting to click a body part or rephrase], "disclaimer": "educational only, not medical advice" }
}
RESEARCH EVERY FACT with WebSearch/WebFetch on trusted medical sources (StatPearls/NCBI, MedlinePlus, Cleveland Clinic, Mayo Clinic, Kenhub, TeachMeAnatomy, NIH SEER training, Britannica). No claims from memory. Own wording. Save the file early and update it as you go (if it already exists from an interrupted run, continue from it). Validate the JSON parses with Python. Return a short summary.`

const REVIEW_SCHEMA = {
  type: 'object',
  properties: {
    issues: { type: 'array', items: { type: 'object', properties: {
      id: { type: 'string' }, severity: { type: 'string', enum: ['critical', 'major', 'minor'] }, problem: { type: 'string' }, fix: { type: 'string' } },
      required: ['id', 'severity', 'problem', 'fix'] } },
    missingImportant: { type: 'array', items: { type: 'string' } },
    notes: { type: 'string' },
  },
  required: ['issues', 'missingImportant', 'notes'],
}
const SCORE_SCHEMA = {
  type: 'object',
  properties: {
    score: { type: 'integer', minimum: 1, maximum: 10 },
    accuracy: { type: 'integer', minimum: 1, maximum: 10 },
    modelMatching: { type: 'integer', minimum: 1, maximum: 10 },
    levelAndClarity: { type: 'integer', minimum: 1, maximum: 10 },
    coverage: { type: 'integer', minimum: 1, maximum: 10 },
    sourcing: { type: 'integer', minimum: 1, maximum: 10 },
    mustFix: { type: 'array', items: { type: 'string' } },
    rationale: { type: 'string' },
  },
  required: ['score', 'accuracy', 'modelMatching', 'levelAndClarity', 'coverage', 'sourcing', 'mustFix', 'rationale'],
}

function researchPrompt(s, feedback) {
  const base = s.key === 'doctor' ? DOCTOR_SPEC
    : `You are the ${s.title} research agent for a medically accurate 3D anatomy website (adult male, based on Z-Anatomy/BodyParts3D models). Suggested coverage: ${s.hint}` + ENTRY_SPEC.replaceAll('{KEY}', s.key).replace('{TARGET}', s.target)
  if (!feedback) return base
  return base + `\n\nREVISION ROUND. The file ${ROOT}\\content\\${s.key}.json already exists. Read it, then fix EVERY issue below (re-research where needed, verify with sources), keep what is good, and rewrite the file. Validate again.\nFEEDBACK:\n${feedback}`
}

const results = await pipeline(SECTIONS, async (s) => {
  let feedback = null
  let last = null
  for (let round = 1; round <= 3; round++) {
    await agent(researchPrompt(s, feedback), { label: `${s.key}: research r${round}`, phase: 'Research' })
    const review = await agent(
      `You are a senior anatomy professor reviewing content for a medical-student-level 3D anatomy website. Read ${ROOT}\\content\\${s.key}.json` +
      (s.key !== 'doctor' ? ` and the model object list ${ROOT}\\content\\names\\${s.key}.txt.` : '.') +
      ` Check EVERY claim for medical accuracy by researching with WebSearch/WebFetch on trusted sources (StatPearls, Kenhub, TeachMeAnatomy, MedlinePlus, Cleveland Clinic, Radiopaedia). Check: wrong facts or numbers, wrong function, wrong location, medical vs common name correctness (common name must be a real widely-used term or plain descriptor), "match" object names mapping to the wrong 3D object or missing left/right or sub-parts (use Python to check names exist and to grep the names file for related objects), too technical or too shallow for an educated adult, missing important structures present in the model, broken/untrustworthy sources, copied text. Be specific: give the structure id, the problem, and the fix.`,
      { label: `${s.key}: review r${round}`, phase: 'Review', schema: REVIEW_SCHEMA })
    const score = await agent(
      `You are an independent, strict scoring judge for medical educational content. Read ${ROOT}\\content\\${s.key}.json` + (s.key !== 'doctor' ? ` and ${ROOT}\\content\\names\\${s.key}.txt` : '') +
      `. A reviewer produced these findings (verify them yourself; they may be wrong or incomplete):\n${JSON.stringify(review)}\n\nSpot-check at least 8 facts against trusted sources with WebSearch/WebFetch, and run Python to verify match names exist. Score 1-10 each: accuracy (most important - any real factual error caps overall at 7), modelMatching, levelAndClarity, coverage, sourcing. Overall score is an integer 1-10; 9 or 10 means publishable for medical students with no factual errors. List mustFix items required to reach 9+.`,
      { label: `${s.key}: score r${round}`, phase: 'Score', schema: SCORE_SCHEMA })
    last = { section: s.key, round, score, review }
    if (!score) break
    log(`${s.key} round ${round}: ${score.score}/10`)
    if (score.score >= 9) return { ...last, passed: true }
    feedback = JSON.stringify({ reviewerIssues: review ? review.issues : [], missingImportant: review ? review.missingImportant : [], scorerMustFix: score.mustFix, scorerRationale: score.rationale })
  }
  return { ...last, passed: false }
})

phase('Final review')
const final = await agent(
  `You are the chief medical editor. Read all JSON files in ${ROOT}\\content\\ (skeleton, muscles, arteries, veins, organs, nerves, skin, doctor). Check cross-file consistency (e.g. same fact stated differently, the same 3D object matched in two structures within one file, contradictory numbers between doctor FAQ and section files, colour conventions). Fix small inconsistencies directly in the files (research to decide which is correct), validate JSON with Python, and return a list of what you changed and any remaining concerns.`,
  { label: 'chief editor', phase: 'Final review' })

return { sections: results.map(r => r && { section: r.section, round: r.round, passed: r.passed, score: r.score && r.score.score, sub: r.score }), final }
