/* ═══════════════════════════════════════════════════════════════════
WINEMAKING NOTEBOOK — app.js
Version 1: Gap Analysis + Routing. No trials. No learning loop.

Sections:
1. Namespace Setup
2. Constants
3. Schema
4. Storage
5. Gap Engine
6. Routing Engine
7. Session Manager
8. UI — Renderer utilities
9. UI — Screen 1: Dashboard
10. UI — Screen 2: Setup
11. UI — Screen 3: Sensory Entry
12. UI — Screen 4: Gap Analysis
13. UI — Screen 5: Shortlist
14. UI — Spider Chart
15. UI — Navigation
16. Init
═══════════════════════════════════════════════════════════════════ */

‘use strict’;

// ─────────────────────────────────────────────────────────────────────────────
// 1. NAMESPACE SETUP
// ─────────────────────────────────────────────────────────────────────────────

window.WN = window.WN || {};

WN.gap      = WN.gap      || {};
WN.routing  = WN.routing  || {};
WN.storage  = WN.storage  || {};
WN.session  = WN.session  || {};
WN.ui       = WN.ui       || {};

// ─────────────────────────────────────────────────────────────────────────────
// 2. CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

WN.C = {
SCORE_MIN: 1,
SCORE_MAX: 5,
STYLES: { PLUSH_NAPA: ‘plush_napa’, BORDEAUX: ‘bordeaux’, FRESH_MODERN: ‘fresh_modern’ },
SEVERITY_SCORES: { NONE: 0, MINOR: 0.5, MODERATE: 1.5, MAJOR: 3.0 },
TIEBREAK: {
GAP_ADDRESSED_MULTIPLIER:  3.0,
RISK_WORSENED_PENALTY:     4.0,
PRIMARY_LEVER_BONUS:       1.0,
MULTI_RULE_BONUS_PER_RULE: 0.5
},
STORAGE: {
SESSION_PREFIX:  ‘wn_session_’,
SESSION_INDEX:   ‘wn_session_index’,
APP_STATE:       ‘wn_app_state’
},
DIM_KEYS: [
‘perceived_acidity’, ‘tannin_angularity’, ‘drying_on_gums’,
‘mid_palate_density’, ‘sweetness_perception’, ‘aromatic_lift’,
‘finish_softness’, ‘structural_weight’
],
STAGES: [
{ value: ‘post_fermentation’, label: ‘Post-Fermentation’ },
{ value: ‘post_mlf’,          label: ‘Post-MLF’ },
{ value: ‘aging’,             label: ‘Aging / Barrel’ },
{ value: ‘pre_bottling’,      label: ‘Pre-Bottling’ },
{ value: ‘post_bottling’,     label: ‘Post-Bottling’ }
]
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. SCHEMA — dimensions, anchors, style vectors
// ─────────────────────────────────────────────────────────────────────────────

WN.schema = {

dimensions: {
perceived_acidity: {
label: ‘Perceived Acidity’,
anchors: {
1: ‘Flat. No salivary response. Sides of tongue unstimulated.’,
3: ‘Present but balanced. Moderate brightness. Saliva response is moderate.’,
5: ‘Sharp or aggressive. Strong jaw-salivation. Feels pointed or cutting.’
},
directionLabels: { pos: ‘Too sharp’, neg: ‘Too flat’ }
},
tannin_angularity: {
label: ‘Tannin Angularity’,
anchors: {
1: ‘No angular sensation. Tannins imperceptible or completely smooth.’,
3: ‘Mildly textured. Fine-grain fabric, not sandpaper. Structure without hardness.’,
5: ‘Hard or jagged. Pointed, scratchy, granular. Often unresolved phenolics.’
},
directionLabels: { pos: ‘Too angular / hard’, neg: ‘Too soft / gripless’ }
},
drying_on_gums: {
label: ‘Drying on Gums’,
anchors: {
1: ‘No drying. Gum tissue feels fully moist after swallowing.’,
3: ‘Mild drying. Slight grip on gums. Detectable but not uncomfortable.’,
5: ‘Strong drying. Gums feel noticeably parched. Chalky coating.’
},
directionLabels: { pos: ‘Too astringent’, neg: ‘Too unctuously smooth’ }
},
mid_palate_density: {
label: ‘Mid-Palate Density’,
anchors: {
1: ‘Thin or hollow. Wine transitions with little presence. Feels watery.’,
3: ‘Moderate presence. Detectable body. Fills the mouth but doesn't overwhelm.’,
5: ‘Dense or saturating. Wine feels thick, full, sustained. High coating.’
},
directionLabels: { pos: ‘Too dense / extracted’, neg: ‘Too thin / hollow’ }
},
sweetness_perception: {
label: ‘Sweetness Perception’,
anchors: {
1: ‘Bone dry perception. No sweetness signal. Wine reads austerely dry.’,
3: ‘Subtly fruity-dry. Faint impression of roundness or fruit sweetness.’,
5: ‘Noticeably sweet. Clear sweetness at tip of tongue. Off-dry to semi-sweet.’
},
directionLabels: { pos: ‘Too sweet / heavy’, neg: ‘Too austere / dry’ }
},
aromatic_lift: {
label: ‘Aromatic Lift’,
anchors: {
1: ‘Closed or flat. Very little aroma from glass. Retronasal experience muted.’,
3: ‘Present and expressive. Clear aromas. Retronasal experience is rewarding.’,
5: ‘Intense or volatile. Highly expressive, possibly sharp or alcohol-lifted.’
},
directionLabels: { pos: ‘Too volatile / sharp’, neg: ‘Too closed / flat’ }
},
finish_softness: {
label: ‘Finish Softness’,
anchors: {
1: ‘Abrupt or harsh. Finish cuts off. Hard, drying, or bitter sensation.’,
3: ‘Neutral to moderately soft. Finish is clean and moderate in length.’,
5: ‘Pillowy and cushioned. Smooth, long, almost enveloping. No hard edges.’
},
directionLabels: { pos: ‘Too blowsy / sweet’, neg: ‘Too hard / abrupt’ }
},
structural_weight: {
label: ‘Structural Weight’,
anchors: {
1: ‘Very light. Wine feels almost weightless. Delicate, possibly thin.’,
3: ‘Medium-weight. Wine has clear presence without heaviness.’,
5: ‘Full and heavy. Wine feels weighty and substantial.’
},
directionLabels: { pos: ‘Too heavy / alcoholic’, neg: ‘Too light / insubstantial’ }
}
},

styleVectors: {
plush_napa: {
label: ‘Plush Napa’,
description: ‘Caymus-style. Dense, soft, low-acid, generous.’,
dimensions: {
perceived_acidity:    { low: 2.0, high: 3.0, midpoint: 2.5 },
tannin_angularity:    { low: 1.0, high: 2.0, midpoint: 1.5 },
drying_on_gums:       { low: 1.0, high: 2.0, midpoint: 1.5 },
mid_palate_density:   { low: 4.0, high: 5.0, midpoint: 4.5 },
sweetness_perception: { low: 3.0, high: 4.0, midpoint: 3.5 },
aromatic_lift:        { low: 2.0, high: 3.0, midpoint: 2.5 },
finish_softness:      { low: 4.0, high: 5.0, midpoint: 4.5 },
structural_weight:    { low: 4.0, high: 5.0, midpoint: 4.5 }
}
},
bordeaux: {
label: ‘Classic Bordeaux’,
description: ‘Structured, dry, firm tannins, high aromatic.’,
dimensions: {
perceived_acidity:    { low: 2.5, high: 3.5, midpoint: 3.0 },
tannin_angularity:    { low: 2.0, high: 3.0, midpoint: 2.5 },
drying_on_gums:       { low: 2.0, high: 3.0, midpoint: 2.5 },
mid_palate_density:   { low: 2.5, high: 3.5, midpoint: 3.0 },
sweetness_perception: { low: 1.5, high: 2.5, midpoint: 2.0 },
aromatic_lift:        { low: 3.0, high: 4.0, midpoint: 3.5 },
finish_softness:      { low: 2.5, high: 3.5, midpoint: 3.0 },
structural_weight:    { low: 3.0, high: 4.0, midpoint: 3.5 }
}
},
fresh_modern: {
label: ‘Fresh Modern’,
description: ‘Higher acidity, light body, intense aromatics.’,
dimensions: {
perceived_acidity:    { low: 3.0, high: 4.0, midpoint: 3.5 },
tannin_angularity:    { low: 1.0, high: 2.0, midpoint: 1.5 },
drying_on_gums:       { low: 1.0, high: 1.5, midpoint: 1.25 },
mid_palate_density:   { low: 1.5, high: 2.5, midpoint: 2.0 },
sweetness_perception: { low: 1.5, high: 2.5, midpoint: 2.0 },
aromatic_lift:        { low: 4.0, high: 5.0, midpoint: 4.5 },
finish_softness:      { low: 3.0, high: 4.0, midpoint: 3.5 },
structural_weight:    { low: 1.5, high: 2.5, midpoint: 2.0 }
}
}
}
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. STORAGE
// ─────────────────────────────────────────────────────────────────────────────

WN.storage = (function () {
const K = WN.C.STORAGE;

function _w(key, val) {
try { localStorage.setItem(key, JSON.stringify(val)); return true; }
catch (e) { console.error(’[WN.storage] write failed’, key, e); return false; }
}
function _r(key) {
try {
const raw = localStorage.getItem(key);
return raw === null ? null : JSON.parse(raw);
} catch (e) { return null; }
}

function _loadIndex() { return _r(K.SESSION_INDEX) || {}; }
function _saveIndex(idx) { _w(K.SESSION_INDEX, idx); }

function _updateIndex(s) {
const idx = _loadIndex();
idx[s.sessionId] = {
sessionId:   s.sessionId,
lotName:     s.lotName     || ‘’,
targetStyle: s.targetStyle || ‘’,
date:        s.date        || ‘’,
status:      s.status      || ‘setup’,
updatedAt:   new Date().toISOString()
};
_saveIndex(idx);
}

return {
saveSession(s) {
_updateIndex(s);
return _w(K.SESSION_PREFIX + s.sessionId, s);
},
loadSession(id)  { return _r(K.SESSION_PREFIX + id); },
deleteSession(id) {
const idx = _loadIndex(); delete idx[id]; _saveIndex(idx);
try { localStorage.removeItem(K.SESSION_PREFIX + id); } catch (e) {}
},
listSessions() {
return Object.values(_loadIndex())
.sort((a, b) => (b.updatedAt || ‘’) > (a.updatedAt || ‘’) ? 1 : -1);
},
loadAppState() {
const defaults = { expertMode: false, lastScreen: null };
return Object.assign({}, defaults, _r(K.APP_STATE) || {});
},
saveAppState(s) { _w(K.APP_STATE, s); }
};
})();

// ─────────────────────────────────────────────────────────────────────────────
// 5. GAP ENGINE
// Pure functions. Range-first. Compounds computed once, consumed by routing.
// ─────────────────────────────────────────────────────────────────────────────

WN.gap = (function () {
const S = WN.schema;
const C = WN.C;

function _r2(n) { return Math.round(n * 100) / 100; }

function classifySeverity(gap) {
if (gap <= 0)   return ‘NONE’;
if (gap <= 0.5) return ‘MINOR’;
if (gap <= 1.0) return ‘MODERATE’;
return ‘MAJOR’;
}

function _sevGte(sev, threshold) {
const o = [‘NONE’, ‘MINOR’, ‘MODERATE’, ‘MAJOR’];
return o.indexOf(sev) >= o.indexOf(threshold);
}

function computeBoundaryGap(score, range) {
const { low, high, midpoint } = range;
const deviation = _r2(score - midpoint);
if (score >= low && score <= high)
return { withinRange: true,  direction: ‘NONE’, boundaryGap: 0, deviation };
if (score > high)
return { withinRange: false, direction: ‘POS’,  boundaryGap: _r2(score - high), deviation };
return   { withinRange: false, direction: ‘NEG’,  boundaryGap: _r2(low - score),  deviation };
}

// Compound rule helpers (act on already-computed dim objects)
function _pos(d, t) { return d && !d.withinRange && d.direction === ‘POS’ && _sevGte(d.severity, t || ‘MODERATE’); }
function _neg(d, t) { return d && !d.withinRange && d.direction === ‘NEG’ && _sevGte(d.severity, t || ‘MODERATE’); }

// All six compound rules live here — routing only consumes, never re-evaluates
const _compoundFns = [
d => (_pos(d.perceived_acidity) && _pos(d.tannin_angularity))
? { ruleId: ‘C-01’, label: ‘Two-Vector Sharpness’,
description: ‘Both perceived acidity and tannin angularity are above target range. The combination creates a dual-axis sharpness problem that single-dimension intervention is unlikely to resolve.’ }
: null,

```
d => (_neg(d.mid_palate_density) && _neg(d.structural_weight))
  ? { ruleId: 'C-02', label: 'Thin and Hollow',
      description: 'Both mid-palate density and structural weight are below target range. The wine has a body deficit that textural interventions alone cannot correct.' }
  : null,

d => (_neg(d.aromatic_lift) && _neg(d.sweetness_perception) && _neg(d.mid_palate_density))
  ? { ruleId: 'C-03', label: 'Flat and Austere',
      description: 'Aromatic lift, sweetness perception, and mid-palate density are all below target range simultaneously. The wine reads closed, dry, and insubstantial.' }
  : null,

d => (_pos(d.tannin_angularity) && _neg(d.mid_palate_density))
  ? { ruleId: 'C-04', label: 'Angular and Hollow',
      description: 'Tannin angularity is above target range while mid-palate density is below. These are in tension: softening tannin risks thinning the wine further; adding density may worsen angularity.' }
  : null,

// C-05: CRITICAL — parentheses are explicit: finish NEG AND (angularity POS OR drying POS)
d => {
  const hardFinish    = _neg(d.finish_softness);
  const hasAngularity = _pos(d.tannin_angularity);
  const hasDrying     = _pos(d.drying_on_gums);
  return (hardFinish && (hasAngularity || hasDrying))
    ? { ruleId: 'C-05', label: 'Hard Finish Compound',
        description: 'Finish softness is below target range, accompanied by tannin angularity or gum drying above range. The hard finish is tannin-connected rather than isolated.' }
    : null;
},

d => (_pos(d.structural_weight) && _neg(d.aromatic_lift))
  ? { ruleId: 'C-06', label: 'Overweight and Flat',
      description: 'Structural weight is above target range while aromatic lift is below. Excess mass is suppressing aromatic expression.' }
  : null
```

];

function _buildStatement(flags, dims) {
if (flags.length === 0) {
const anyFlagged = Object.values(dims).some(d => _sevGte(d.severity, ‘MODERATE’));
return anyFlagged
? ‘No compound pattern detected. Review individual dimension flags below.’
: ‘All dimensions are within target range. No stylistic correction indicated.’;
}
let s = flags[0].description;
if (flags.length > 1)
s += ’ Additionally: ’ + flags.slice(1).map(f => f.label).join(’ and ‘) + ’ pattern also detected.’;
return s;
}

function analyze(scores, styleKey) {
const vector = S.styleVectors[styleKey];
if (!vector) throw new Error(’Unknown styleKey: ’ + styleKey);

```
const dims = {};
for (const k of C.DIM_KEYS) {
  const score = scores[k];
  if (score == null) throw new Error('Missing score: ' + k);
  if (score < C.SCORE_MIN || score > C.SCORE_MAX)
    throw new Error('Score out of range for ' + k + ': ' + score);

  const range  = vector.dimensions[k];
  const result = computeBoundaryGap(score, range);
  const sev    = classifySeverity(result.boundaryGap);
  const dimDef = S.dimensions[k];
  const label  = result.direction === 'NONE' ? 'Within target range'
    : result.direction === 'POS' ? dimDef.directionLabels.pos
    : dimDef.directionLabels.neg;

  dims[k] = {
    score, withinRange: result.withinRange, direction: result.direction,
    boundaryGap: result.boundaryGap, severity: sev,
    deviation: result.deviation, label,
    range: { low: range.low, high: range.high, midpoint: range.midpoint }
  };
}

const compoundFlags = _compoundFns.map(fn => fn(dims)).filter(Boolean);

const outOfRange = Object.entries(dims)
  .filter(([, d]) => !d.withinRange)
  .sort(([, a], [, b]) => b.boundaryGap - a.boundaryGap);

return {
  styleKey, dimensions: dims,
  compoundFlags,
  compoundStatement: _buildStatement(compoundFlags, dims),
  priorityOrder:  outOfRange.map(([k]) => k),
  majorFlags:     outOfRange.filter(([, d]) => d.severity === 'MAJOR').map(([k]) => k),
  moderateFlags:  outOfRange.filter(([, d]) => d.severity === 'MODERATE').map(([k]) => k),
  minorFlags:     outOfRange.filter(([, d]) => d.severity === 'MINOR').map(([k]) => k),
  flaggedDimensions: outOfRange.map(([k]) => k)
};
```

}

return { analyze, computeBoundaryGap, classifySeverity };
})();

// ─────────────────────────────────────────────────────────────────────────────
// 6. ROUTING ENGINE
// Consumes gap output. Returns ranked shortlist (max 5).
// ─────────────────────────────────────────────────────────────────────────────

WN.routing = (function () {
const C = WN.C;

// Catalog inline (abbreviated for core levers needed in routing logic)
const CATALOG = {
A1: { title: ‘Add Higher-Density Lot’,                   timeHorizon: ‘immediate’,       category: ‘blending’ },
A2: { title: ‘Add Softer-Tannin Lot’,                    timeHorizon: ‘immediate’,       category: ‘blending’ },
A3: { title: ‘Add Aromatic-Lift Lot’,                    timeHorizon: ‘immediate’,       category: ‘blending’ },
A4: { title: ‘Add Lower-Acidity Lot’,                    timeHorizon: ‘immediate’,       category: ‘blending’ },
A1_A2_COMBO: { title: ‘Blend: Higher-Density + Softer-Tannin Lot’,timeHorizon:‘immediate’,category:‘blending’},
B1: { title: ‘Extended Barrel Aging’,                    timeHorizon: ‘months’,          category: ‘aging’    },
B2: { title: ‘Bottle Aging / Hold Time’,                 timeHorizon: ‘months_to_years’, category: ‘aging’    },
B3: { title: ‘Delayed Racking (Sur Lie)’,                timeHorizon: ‘weeks_to_months’, category: ‘aging’    },
C1: { title: ‘Micro-Oxygenation’,                        timeHorizon: ‘weeks_to_months’, category: ‘oxygen’   },
C2: { title: ‘Controlled Splash Racking / Aeration’,     timeHorizon: ‘immediate’,       category: ‘oxygen’   },
D1: { title: ‘Polysaccharide Addition’,                  timeHorizon: ‘days_to_weeks’,   category: ‘fining’   },
D2: { title: ‘Protein-Based Fining’,                     timeHorizon: ‘days_to_weeks’,   category: ‘fining’   },
D3: { title: ‘Tannin Addition (Enological)’,             timeHorizon: ‘days_to_weeks’,   category: ‘fining’   },
D4: { title: ‘Clarification for Aromatic Release’,       timeHorizon: ‘days_to_weeks’,   category: ‘fining’   },
E1: { title: ‘Residual Sugar Adjustment’,                timeHorizon: ‘immediate’,       category: ‘sweetness’},
E2: { title: ‘MLF Completion Management’,                timeHorizon: ‘weeks_to_months’, category: ‘sweetness’}
};

// Risk catalog: what each lever risks worsening
const RISKS = {
A1: { riskFlags: [‘Donor lot must be pre-screened on full sensory schema’,‘May worsen angularity if donor is highly extracted’],
prerequisites: [‘Qualified higher-density donor lot available’] },
A2: { riskFlags: [‘May reduce mid-palate density if donor is light-bodied’],
prerequisites: [‘Donor lot with confirmed low angularity score’] },
A3: { riskFlags: [‘Higher-aromatic lots often carry higher perceived acidity’],
prerequisites: [‘Donor lot with confirmed high aromatic lift’] },
A4: { riskFlags: [‘May flatten aromatic lift’],
prerequisites: [‘Donor lot with confirmed low acidity’] },
A1_A2_COMBO: { riskFlags: [‘Donor lot must satisfy BOTH density and softness requirements’,‘Full sensory schema evaluation required before bench trial’],
prerequisites: [‘Single lot confirmed high on density AND low on tannin angularity’] },
B1: { riskFlags: [‘May reduce aromatic lift over extended aging’],
prerequisites: [‘Wine has sufficient density to support extended aging’] },
B2: { riskFlags: [‘Irreversible — cannot undo if wine ages past its window’],
prerequisites: [‘Wine is stylistically close to target with minor gaps only’] },
B3: { riskFlags: [‘Reduction risk if lees are heavy’],
prerequisites: [‘Wine is microbiologically stable’, ‘Lees are clean and fine’] },
C1: { riskFlags: [‘Over-application can flatten aromatic lift significantly’,‘Irreversible if taken too far’],
prerequisites: [‘Aromatic lift within or above range (has headroom)’] },
C2: { riskFlags: [‘One-time exposure — effect not sustained’,‘Risk of premature oxidation’],
prerequisites: [‘Reductive character confirmed as suppressing aromatic lift’] },
D1: { riskFlags: [‘Will not correct a major density deficit — textural only’,‘Bench trials required before full-lot application’],
prerequisites: [‘Wine is microbiologically stable’] },
D2: { riskFlags: [‘Highest stripping risk of any textural lever’,‘Irreversible — bench trialing is essential’],
prerequisites: [‘Tannin angularity at MAJOR level’,‘Gentler interventions exhausted’] },
D3: { riskFlags: [‘May worsen angularity if tannin type is mismatched’,‘Bench trials essential’],
prerequisites: [‘Tannin type compatibility evaluated’] },
D4: { riskFlags: [‘Effect on aromatic lift is indirect and not guaranteed’,‘May reduce textural complexity’],
prerequisites: [‘Aromatic suppression from reductive compounds or turbidity suspected’] },
E1: { riskFlags: [‘Microbiological stability must be confirmed — refermentation risk’,‘May overshoot sweetness perception ceiling’],
prerequisites: [‘Wine is microbiologically stable or will be stabilized’] },
E2: { riskFlags: [‘Irreversible once complete’,‘Full MLF may suppress primary fruit aromatics’],
prerequisites: [‘MLF not yet complete’] }
};

// Lever dimension effects — used for tie-break scoring
const EFFECTS = {
A1:          { up: [‘mid_palate_density’,‘structural_weight’,‘sweetness_perception’,‘finish_softness’], down: [], risk_up: [], risk_down: [‘aromatic_lift’] },
A2:          { up: [‘finish_softness’], down: [‘tannin_angularity’,‘drying_on_gums’], risk_up: [], risk_down: [‘mid_palate_density’,‘structural_weight’] },
A3:          { up: [‘aromatic_lift’], down: [], risk_up: [‘perceived_acidity’], risk_down: [‘sweetness_perception’] },
A4:          { up: [], down: [‘perceived_acidity’], risk_up: [], risk_down: [‘aromatic_lift’] },
A1_A2_COMBO: { up: [‘mid_palate_density’,‘structural_weight’,‘finish_softness’], down: [‘tannin_angularity’,‘drying_on_gums’], risk_up: [], risk_down: [] },
B1:          { up: [], down: [‘tannin_angularity’,‘drying_on_gums’], risk_up: [], risk_down: [‘aromatic_lift’,‘sweetness_perception’] },
B2:          { up: [‘finish_softness’], down: [‘tannin_angularity’], risk_up: [], risk_down: [] },
B3:          { up: [‘finish_softness’], down: [‘tannin_angularity’], risk_up: [], risk_down: [] },
C1:          { up: [‘finish_softness’], down: [‘tannin_angularity’,‘drying_on_gums’], risk_up: [], risk_down: [‘aromatic_lift’] },
C2:          { up: [‘aromatic_lift’], down: [‘tannin_angularity’], risk_up: [], risk_down: [] },
D1:          { up: [‘finish_softness’,‘mid_palate_density’,‘sweetness_perception’], down: [‘tannin_angularity’,‘drying_on_gums’], risk_up: [], risk_down: [‘aromatic_lift’] },
D2:          { up: [‘finish_softness’], down: [‘tannin_angularity’,‘drying_on_gums’], risk_up: [], risk_down: [‘mid_palate_density’,‘structural_weight’] },
D3:          { up: [‘mid_palate_density’,‘structural_weight’], down: [], risk_up: [‘tannin_angularity’], risk_down: [‘sweetness_perception’] },
D4:          { up: [‘aromatic_lift’], down: [], risk_up: [], risk_down: [‘mid_palate_density’] },
E1:          { up: [‘sweetness_perception’,‘finish_softness’], down: [‘perceived_acidity’], risk_up: [], risk_down: [‘aromatic_lift’] },
E2:          { up: [‘sweetness_perception’,‘finish_softness’], down: [‘perceived_acidity’], risk_up: [], risk_down: [‘aromatic_lift’] }
};

// Compound rules → lever order + rationale
const COMPOUND_MAP = {
‘C-01’: { levers: [‘A2’,‘D1’,‘C1’,‘E2’,‘B1’],          why: ‘A2 addresses both sharpness vectors simultaneously — softer tannin reduces angularity while the density contribution attenuates acid sharpness.’ },
‘C-02’: { levers: [‘A1’,‘D3’,‘E1’,‘D1’,‘B1’],          why: ‘Body deficit requires extract mass. Only a higher-density blend lot adds genuine mass to both density and structural weight simultaneously.’ },
‘C-03’: { levers: [‘A3’,‘A1’,‘E1’,‘C2’,‘D4’],          why: ‘A3 addresses the aromatic deficit — the most perceptually dominant failure — while contributing density. Other levers address only one of the three flagged dimensions.’ },
‘C-04’: { levers: [‘A1_A2_COMBO’,‘D1’,‘A1’,‘B1’,‘C1’], why: ‘Angular and hollow places corrective directions in tension. A pre-screened lot that is both denser and softer-tannin is the only single-operation solution.’ },
‘C-05’: { levers: [‘D1’,‘A2’,‘C1’,‘B1’,‘E1’],          why: ‘Polysaccharides act on angularity, gum drying, and finish softness simultaneously — three flagged dimensions — with minimal risk to density or aromatics.’ },
‘C-06’: { levers: [‘A3’,‘A4’,‘D4’,‘C2’,‘B3’],          why: ‘Adding an aromatic-lift lot simultaneously reduces average structural weight of the blend and opens the aromatic register.’ }
};

const COMPOUND_DIM_COVERAGE = {
‘C-01’: [‘perceived_acidity’,‘tannin_angularity’],
‘C-02’: [‘mid_palate_density’,‘structural_weight’],
‘C-03’: [‘aromatic_lift’,‘sweetness_perception’,‘mid_palate_density’],
‘C-04’: [‘tannin_angularity’,‘mid_palate_density’],
‘C-05’: [‘finish_softness’,‘tannin_angularity’,‘drying_on_gums’],
‘C-06’: [‘structural_weight’,‘aromatic_lift’]
};

// Single-dimension rules
const SINGLE_RULES = [
{ id: ‘S-01’,
check: (d, s) => d.tannin_angularity.severity === ‘MAJOR’ && d.perceived_acidity.withinRange && d.mid_palate_density.withinRange,
levers: [‘C1’,‘D1’,‘B1’,‘A2’,‘B2’],
why: ‘Isolated angularity — micro-oxygenation facilitates tannin polymerization without touching density or acidity.’ },
{ id: ‘S-02’,
check: (d, s) => !d.mid_palate_density.withinRange && d.mid_palate_density.direction === ‘NEG’ && d.structural_weight.withinRange && d.tannin_angularity.withinRange,
levers: [‘A1’,‘D1’,‘D3’,‘E1’,‘B1’],
why: ‘Structural weight is in range — the wine has frame but lacks mid-palate fill. A1 adds extract-driven presence.’ },
{ id: ‘S-03’,
check: (d, s) => !d.finish_softness.withinRange && d.finish_softness.direction === ‘NEG’ && d.tannin_angularity.withinRange && d.drying_on_gums.withinRange,
levers: [‘D1’,‘E1’,‘B2’,‘A2’,‘B1’],
why: ‘Finish problem is tactile, not tannin-driven. Polysaccharides improve cushion without modifying the tannin system.’ },
{ id: ‘S-04’,
check: (d, s) => !d.sweetness_perception.withinRange && d.sweetness_perception.direction === ‘NEG’ && d.mid_palate_density.withinRange && d.finish_softness.withinRange && s !== ‘fresh_modern’ && s !== ‘bordeaux’,
levers: [‘E1’,‘D1’,‘A1’,‘E2’,‘B1’],
why: ‘Isolated sweetness deficit — RS is the most direct lever. Microbiological stability must be confirmed.’ },
{ id: ‘S-05’,
check: (d, s) => !d.aromatic_lift.withinRange && d.aromatic_lift.direction === ‘NEG’ && d.sweetness_perception.withinRange && d.mid_palate_density.withinRange,
levers: [‘D4’,‘C2’,‘A3’,‘B3’,‘B1’],
why: ‘Isolated aromatic suppression — D4 removes suppressing compounds at lower risk than aeration or blending.’ },
{ id: ‘S-06’,
check: (d, s) => !d.perceived_acidity.withinRange && d.perceived_acidity.direction === ‘POS’ && d.tannin_angularity.withinRange,
levers: [‘E2’,‘A4’,‘E1’,‘D1’,‘B1’],
why: ‘Acid-driven sharpness without angularity — MLF completion is most chemically targeted if MLF is still incomplete.’ },
{ id: ‘S-07’,
check: (d, s) => !d.drying_on_gums.withinRange && d.drying_on_gums.direction === ‘POS’ && d.tannin_angularity.withinRange,
levers: [‘D1’,‘D2’,‘C1’,‘B1’,‘B2’],
why: ‘Fine phenolic load without coarse angularity — polysaccharides integrate this type of astringency effectively.’ },
{ id: ‘S-08’,
check: (d, s) => !d.sweetness_perception.withinRange && d.sweetness_perception.direction === ‘POS’,
levers: [‘A3’,‘A4’,‘B1’,‘D4’],
why: ‘High sweetness — a drier, more aromatic component recalibrates perceptual balance without chemical RS reduction.’ }
];

function _sevGte(sev, threshold) {
const o = [‘NONE’,‘MINOR’,‘MODERATE’,‘MAJOR’];
return o.indexOf(sev) >= o.indexOf(threshold);
}

function _styleFilters(styleKey, dims) {
const excluded = new Set();
if (styleKey === ‘plush_napa’) {
// Allow A3 only when aromatic_lift has a genuine deficit (MODERATE or worse)
const al = dims.aromatic_lift;
if (!(al && !al.withinRange && al.direction === ‘NEG’ && _sevGte(al.severity, ‘MODERATE’)))
excluded.add(‘A3’);
}
if (styleKey === ‘fresh_modern’) { excluded.add(‘A1’); excluded.add(‘D3’); excluded.add(‘E1’); }
if (styleKey === ‘bordeaux’)     { excluded.add(‘E1’); }
return excluded;
}

function _tiebreak(leverKey, dims) {
const eff = EFFECTS[leverKey]; if (!eff) return 0;
const TB = C.TIEBREAK; const SEV = C.SEVERITY_SCORES;
let score = 0;
for (const k of eff.up)         { const d = dims[k]; if (d && !d.withinRange && d.direction === ‘NEG’) score += SEV[d.severity] * TB.GAP_ADDRESSED_MULTIPLIER; }
for (const k of eff.down)       { const d = dims[k]; if (d && !d.withinRange && d.direction === ‘POS’) score += SEV[d.severity] * TB.GAP_ADDRESSED_MULTIPLIER; }
for (const k of eff.risk_up)    { const d = dims[k]; if (d && !d.withinRange && d.direction === ‘POS’) score -= SEV[d.severity] * TB.RISK_WORSENED_PENALTY; }
for (const k of eff.risk_down)  { const d = dims[k]; if (d && !d.withinRange && d.direction === ‘NEG’) score -= SEV[d.severity] * TB.RISK_WORSENED_PENALTY; }
return Math.round(score * 100) / 100;
}

function getShortlist(gapResults, styleKey) {
const dims     = gapResults.dimensions;
const excluded = _styleFilters(styleKey, dims);
const noms     = {};   // leverKey → Set of ruleIds
const whyMap   = {};   // ruleId   → { lever, text }

```
// Compound nominations
for (const cf of gapResults.compoundFlags) {
  const m = COMPOUND_MAP[cf.ruleId]; if (!m) continue;
  whyMap[cf.ruleId] = { lever: m.levers[0], text: m.why };
  for (const lk of m.levers) {
    if (!noms[lk]) noms[lk] = new Set();
    noms[lk].add(cf.ruleId);
  }
}

// Single-dimension nominations
for (const rule of SINGLE_RULES) {
  if (!rule.check(dims, styleKey)) continue;
  const primary = rule.levers[0];
  // Suppress if primary is already covered by a compound rule
  const alreadyCovered = gapResults.compoundFlags.some(cf => {
    const m = COMPOUND_MAP[cf.ruleId];
    return m && m.levers.includes(primary);
  });
  if (alreadyCovered) continue;
  whyMap[rule.id] = { lever: primary, text: rule.why };
  for (const lk of rule.levers) {
    if (!noms[lk]) noms[lk] = new Set();
    noms[lk].add(rule.id);
  }
}

const eligible = Object.keys(noms).filter(k => !excluded.has(k));
if (eligible.length === 0) {
  return { candidates: [], triggeredRules: gapResults.compoundFlags.map(c => c.ruleId),
           styleFiltersApplied: [...excluded], routingNotes: 'No eligible interventions after style filtering.' };
}

const scored = eligible.map(lk => {
  const base       = _tiebreak(lk, dims);
  const isPrimary  = Object.values(whyMap).some(w => w.lever === lk);
  const multiBonus = noms[lk].size > 1 ? C.TIEBREAK.MULTI_RULE_BONUS_PER_RULE * (noms[lk].size - 1) : 0;
  return { leverKey: lk, score: Math.round((base + (isPrimary ? C.TIEBREAK.PRIMARY_LEVER_BONUS : 0) + multiBonus) * 100) / 100, rules: [...noms[lk]] };
});
scored.sort((a, b) => b.score - a.score);

const triggeredRules = new Set();
Object.values(noms).forEach(s => s.forEach(r => triggeredRules.add(r)));

const candidates = scored.slice(0, 5).map((entry, i) => {
  const meta   = CATALOG[entry.leverKey] || {};
  const risk   = RISKS[entry.leverKey]   || {};
  const reasons = [];
  const warnings = [...(risk.riskFlags || [])];

  for (const rid of entry.rules) {
    const w = whyMap[rid];
    if (w && w.lever === entry.leverKey) reasons.push('[' + rid + '] ' + w.text);
  }
  if (reasons.length === 0)
    reasons.push('Supporting intervention nominated by: ' + entry.rules.join(', '));

  // Dynamic active-risk warnings
  const eff = EFFECTS[entry.leverKey] || {};
  for (const k of (eff.risk_down || [])) {
    const d = dims[k];
    if (d && !d.withinRange && d.direction === 'NEG')
      warnings.push('ACTIVE RISK: ' + WN.schema.dimensions[k].label + ' is already below range — this lever may worsen it.');
  }
  for (const k of (eff.risk_up || [])) {
    const d = dims[k];
    if (d && !d.withinRange && d.direction === 'POS')
      warnings.push('ACTIVE RISK: ' + WN.schema.dimensions[k].label + ' is already above range — this lever may worsen it.');
  }

  return {
    rank: i + 1,
    leverKey:     entry.leverKey,
    title:        meta.title        || entry.leverKey,
    score:        entry.score,
    timeHorizon:  meta.timeHorizon  || 'unknown',
    reasons, warnings,
    prerequisites: risk.prerequisites || [],
    rules: entry.rules
  };
});

return {
  candidates,
  triggeredRules: [...triggeredRules],
  styleFiltersApplied: [...excluded],
  routingNotes: triggeredRules.size + ' rule(s). ' + excluded.size + ' excluded. ' + candidates.length + ' candidates.'
};
```

}

return { getShortlist };
})();

// ─────────────────────────────────────────────────────────────────────────────
// 7. SESSION MANAGER
// In-memory draft + persistent save via storage.
// ─────────────────────────────────────────────────────────────────────────────

WN.session = (function () {
// In-memory draft — survives navigation between screens within a flow
let _draft = null;

function *uuid() {
return ’sess*’ + Date.now() + ‘_’ + Math.random().toString(36).slice(2, 8);
}

return {
startNew(lotName, targetStyle, stage, date) {
_draft = {
sessionId:   _uuid(),
lotName, targetStyle, stage,
date:        date || new Date().toISOString().slice(0, 10),
scores:      {},
gapResults:  null,
shortlist:   null,
status:      ‘setup’,
createdAt:   new Date().toISOString()
};
return _draft;
},

```
getDraft()   { return _draft; },
clearDraft() { _draft = null; },

setScores(scores) {
  if (!_draft) return;
  _draft.scores = Object.assign({}, scores);
},

runAnalysis() {
  if (!_draft || Object.keys(_draft.scores).length < 8) return null;
  _draft.gapResults = WN.gap.analyze(_draft.scores, _draft.targetStyle);
  _draft.shortlist  = WN.routing.getShortlist(_draft.gapResults, _draft.targetStyle);
  _draft.status     = 'tasted';
  return _draft.gapResults;
},

save() {
  if (!_draft) return false;
  return WN.storage.saveSession(_draft);
},

loadById(id) {
  const s = WN.storage.loadSession(id);
  if (s) _draft = s;
  return s;
}
```

};
})();

// ─────────────────────────────────────────────────────────────────────────────
// 8. UI — RENDERER UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

WN.ui = (function () {
// ── State ──────────────────────────────────────────────────────
const _state = {
screen:      ‘dashboard’,
history:     [],
expertMode:  false,
inRangeOpen: false,
selectedLeverKey: null,
openLeverKey:     null
};

// Scratch scores during Sensory Entry — not yet committed to session
let _scratchScores = {};

// ── DOM handles ────────────────────────────────────────────────
const $screen   = () => document.getElementById(‘screen’);
const $navBack  = () => document.getElementById(‘nav-back’);
const $navTitle = () => document.getElementById(‘nav-title’);
const $navExp   = () => document.getElementById(‘nav-expert’);
const $progress = () => document.getElementById(‘nav-progress’);
const $toast    = () => document.getElementById(‘toast’);

// ── Helpers ────────────────────────────────────────────────────
function _el(tag, attrs, …children) {
const el = document.createElement(tag);
if (attrs) {
for (const [k, v] of Object.entries(attrs)) {
if (k === ‘className’) el.className = v;
else if (k === ‘onclick’) el.onclick = v;
else if (k.startsWith(‘data-’)) el.setAttribute(k, v);
else el[k] = v;
}
}
for (const child of children) {
if (child == null) continue;
el.appendChild(typeof child === ‘string’ ? document.createTextNode(child) : child);
}
return el;
}

function _setProgress(pct) {
const el = $progress();
if (el) el.style.setProperty(’–progress’, pct + ‘%’);
}

function _setNav(title, showBack, progress) {
const bt = $navTitle(); if (bt) bt.textContent = title;
const bb = $navBack();
if (bb) bb.classList.toggle(‘hidden’, !showBack);
_setProgress(progress || 0);
const ep = $navExp();
if (ep) ep.classList.toggle(‘active’, _state.expertMode);
// Expert mode class on body
document.body.classList.toggle(‘expert-mode’, _state.expertMode);
}

function _toast(msg, duration) {
const t = $toast(); if (!t) return;
t.textContent = msg;
t.classList.add(‘visible’);
setTimeout(() => t.classList.remove(‘visible’), duration || 2200);
}

function _horizonClass(h) {
if (!h || h === ‘immediate’ || h === ‘immediate_to_days’) return ‘immediate’;
if (h === ‘days_to_weeks’)   return ‘days’;
if (h === ‘weeks_to_months’) return ‘weeks’;
return ‘months’;
}
function _horizonLabel(h) {
const map = {
‘immediate’:         ‘Immediate’,
‘immediate_to_days’: ‘Days’,
‘days_to_weeks’:     ‘Days–Weeks’,
‘weeks_to_months’:   ‘Weeks–Months’,
‘months’:            ‘Months’,
‘months_to_years’:   ‘Months–Years’
};
return map[h] || h;
}

function _today() {
return new Date().toISOString().slice(0, 10);
}

// ─────────────────────────────────────────────────────────────────────────
// 9. SCREEN 1: DASHBOARD
// ─────────────────────────────────────────────────────────────────────────

function renderDashboard() {
_state.screen = ‘dashboard’;
_state.history = [];
_setNav(‘Winemaking Notebook’, false, 0);

```
const sessions = WN.storage.listSessions();
const page = _el('div', { className: 'page' });

page.appendChild(_el('div', { className: 'page-title' }, 'Notebook'));
page.appendChild(_el('div', { className: 'page-subtitle' }, 'Sensory sessions & intervention log'));

// Test harness banner
page.appendChild(_buildTestBanner());

if (sessions.length === 0) {
  const empty = _el('div', { className: 'empty-state' });
  empty.innerHTML = '<div class="empty-icon">🍷</div><p>No sessions yet</p><small>Tap below to begin your first tasting.</small>';
  page.appendChild(empty);
} else {
  const label = _el('div', { className: 'section-label' }, 'Recent Sessions');
  page.appendChild(label);
  for (const s of sessions) {
    page.appendChild(_buildSessionCard(s));
  }
}

const cta = _el('div', { className: 'cta-bar' },
  _el('div', { className: 'cta-bar-inner' },
    _el('button', { className: 'btn btn-primary', onclick: () => renderSetup() }, '+ New Session')
  )
);

$screen().innerHTML = '';
$screen().appendChild(page);
$screen().appendChild(cta);
```

}

function _buildSessionCard(s) {
const statusMap = {
setup:           { cls: ‘tasted’,  label: ‘Setup’ },
tasted:          { cls: ‘tasted’,  label: ‘Tasted’ },
trial_planned:   { cls: ‘trial’,   label: ‘Trial’ },
outcome_recorded:{ cls: ‘outcome’, label: ‘Outcome’ }
};
const st = statusMap[s.status] || { cls: ‘tasted’, label: s.status };
const styleLabel = WN.schema.styleVectors[s.targetStyle]
? WN.schema.styleVectors[s.targetStyle].label : s.targetStyle;

```
const card = _el('button', {
  className: 'session-card',
  onclick: () => openExistingSession(s.sessionId)
});

const main = _el('div', { className: 'session-card-main' });
main.appendChild(_el('div', { className: 'session-lot' }, s.lotName || 'Unnamed Lot'));
const meta = _el('div', { className: 'session-meta' });
meta.appendChild(_el('span', {}, styleLabel || '—'));
meta.appendChild(_el('span', {}, s.date || ''));
main.appendChild(meta);
card.appendChild(main);

const badge = _el('span', { className: 'status-badge ' + st.cls }, st.label);
card.appendChild(badge);

return card;
```

}

function _buildTestBanner() {
const banner = _el(‘div’, { className: ‘test-banner’ });
banner.appendChild(_el(‘span’, {}, ‘Dev: load the spec sample tasting to verify gap analysis’));
banner.appendChild(_el(‘button’, {
className: ‘btn-test’,
onclick: () => _loadSampleCase()
}, ‘Load Sample Case’));
return banner;
}

function _loadSampleCase() {
// Spec sample: acidity NOT flagged, angularity MAJOR, density MAJOR, finish MAJOR
const sample = {
perceived_acidity:    2.8,
tannin_angularity:    3.2,
drying_on_gums:       2.5,
mid_palate_density:   2.5,
sweetness_perception: 3.2,
aromatic_lift:        2.3,
finish_softness:      2.5,
structural_weight:    4.1
};
WN.session.startNew(‘Sample Lot — Plush Napa’, ‘plush_napa’, ‘pre_bottling’, _today());
WN.session.setScores(sample);
_scratchScores = Object.assign({}, sample);
WN.session.runAnalysis();
WN.session.save();
renderGap();
}

function openExistingSession(id) {
const s = WN.session.loadById(id);
if (!s) { _toast(‘Session not found’); return; }
_scratchScores = Object.assign({}, s.scores || {});
if (s.gapResults) renderGap();
else renderSensory();
}

// ─────────────────────────────────────────────────────────────────────────
// 10. SCREEN 2: SETUP
// ─────────────────────────────────────────────────────────────────────────

function renderSetup() {
_state.screen = ‘setup’;
_state.history.push(‘dashboard’);
_setNav(‘New Session’, true, 20);

```
const page = _el('div', { className: 'page' });
page.appendChild(_el('div', { className: 'page-title' }, 'Session Setup'));
page.appendChild(_el('div', { className: 'page-subtitle' }, 'Name the lot and choose a target style'));

// Lot name
const fLot = _el('div', { className: 'field' });
fLot.appendChild(_el('label', {}, 'Lot Name'));
const iLotName = _el('input', { type: 'text', placeholder: 'e.g. Barrel 12 — Cab Franc 2024', id: 'input-lot' });
fLot.appendChild(iLotName);
page.appendChild(fLot);

// Style selector
const fStyle = _el('div', { className: 'field' });
fStyle.appendChild(_el('label', {}, 'Target Style'));
const picker = _el('div', { className: 'style-picker', id: 'style-picker' });
let selectedStyle = null;

const styles = [
  { key: 'plush_napa',    name: 'Plush Napa',       sub: 'Dense & soft' },
  { key: 'bordeaux',      name: 'Bordeaux',          sub: 'Structured & dry' },
  { key: 'fresh_modern',  name: 'Fresh Modern',      sub: 'Light & aromatic' }
];
for (const style of styles) {
  const btn = _el('button', { className: 'style-btn' });
  btn.innerHTML = '<span class="style-name">' + style.name + '</span>' + style.sub;
  btn.onclick = () => {
    selectedStyle = style.key;
    picker.querySelectorAll('.style-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    _checkSetupReady();
  };
  picker.appendChild(btn);
}
fStyle.appendChild(picker);
page.appendChild(fStyle);

// Date
const fDate = _el('div', { className: 'field' });
fDate.appendChild(_el('label', {}, 'Tasting Date'));
const iDate = _el('input', { type: 'date', id: 'input-date', value: _today() });
fDate.appendChild(iDate);
page.appendChild(fDate);

// Stage
const fStage = _el('div', { className: 'field' });
fStage.appendChild(_el('label', {}, 'Winemaking Stage'));
const selStage = _el('select', { id: 'input-stage' });
for (const st of WN.C.STAGES) {
  const opt = _el('option', { value: st.value }, st.label);
  selStage.appendChild(opt);
}
fStage.appendChild(selStage);
page.appendChild(fStage);

// Expert fields
const fVintage = _el('div', { className: 'field expert-field' });
fVintage.appendChild(_el('label', {}, 'Vintage'));
fVintage.appendChild(_el('input', { type: 'text', id: 'input-vintage', placeholder: 'e.g. 2023' }));
page.appendChild(fVintage);

const fVarietal = _el('div', { className: 'field expert-field' });
fVarietal.appendChild(_el('label', {}, 'Varietal'));
fVarietal.appendChild(_el('input', { type: 'text', id: 'input-varietal', placeholder: 'e.g. Cabernet Sauvignon' }));
page.appendChild(fVarietal);

const fNotes = _el('div', { className: 'field expert-field' });
fNotes.appendChild(_el('label', {}, 'Lot Notes'));
const ta = _el('textarea', { id: 'input-lotnotes', rows: 3, placeholder: 'Barrel notes, sourcing, etc.' });
ta.style.resize = 'vertical';
fNotes.appendChild(ta);
page.appendChild(fNotes);

// CTA
const ctaBtn = _el('button', { className: 'btn btn-primary', id: 'setup-cta', disabled: true,
  onclick: () => {
    const lotName = document.getElementById('input-lot').value.trim();
    const date    = document.getElementById('input-date').value;
    const stage   = document.getElementById('input-stage').value;
    if (!lotName || !selectedStyle) { _toast('Please fill in lot name and select a style'); return; }
    WN.session.startNew(lotName, selectedStyle, stage, date);
    _scratchScores = {};
    renderSensory();
  }
}, 'Begin Tasting →');

const cta = _el('div', { className: 'cta-bar' },
  _el('div', { className: 'cta-bar-inner' }, ctaBtn)
);

function _checkSetupReady() {
  const lotVal = document.getElementById('input-lot');
  const btn    = document.getElementById('setup-cta');
  if (btn) btn.disabled = !(lotVal && lotVal.value.trim() && selectedStyle);
}
iLotName.oninput = _checkSetupReady;

$screen().innerHTML = '';
$screen().appendChild(page);
$screen().appendChild(cta);
```

}

// ─────────────────────────────────────────────────────────────────────────
// 11. SCREEN 3: SENSORY ENTRY
// ─────────────────────────────────────────────────────────────────────────

function renderSensory() {
_state.screen = ‘sensory’;
if (_state.history[_state.history.length - 1] !== ‘setup’)
_state.history.push(‘setup’);
_setNav(‘Sensory Entry’, true, 40);

```
const draft = WN.session.getDraft();
if (!draft) { renderDashboard(); return; }
const styleLabel = WN.schema.styleVectors[draft.targetStyle]
  ? WN.schema.styleVectors[draft.targetStyle].label : draft.targetStyle;

const page = _el('div', { className: 'page' });
page.appendChild(_el('div', { className: 'page-title' }, draft.lotName));
page.appendChild(_el('div', { className: 'page-subtitle' }, styleLabel + ' · ' + draft.date));

// Progress bar
const progressRow = _el('div', { className: 'progress-track' });
const progressBar = _el('div', { className: 'progress-bar' });
const progressFill = _el('div', { className: 'progress-fill', id: 'score-progress-fill' });
progressBar.appendChild(progressFill);
const progressLabel = _el('div', { className: 'progress-label', id: 'score-progress-label' }, '0 of 8');
progressRow.appendChild(progressBar);
progressRow.appendChild(progressLabel);
page.appendChild(progressRow);

// Spider chart container
const chartWrap = _el('div', { className: 'chart-wrap' });
const canvas = _el('canvas', { id: 'radar-canvas', width: 260, height: 260 });
chartWrap.appendChild(canvas);
page.appendChild(chartWrap);

// Dimension cards
for (const dimKey of WN.C.DIM_KEYS) {
  page.appendChild(_buildDimCard(dimKey, draft.targetStyle));
}

// CTA
const ctaBtn = _el('button', {
  className: 'btn btn-primary', id: 'sensory-cta', disabled: true,
  onclick: () => {
    WN.session.setScores(_scratchScores);
    WN.session.runAnalysis();
    WN.session.save();
    renderGap();
  }
}, 'Run Gap Analysis →');

const ctaBack = _el('button', {
  className: 'btn btn-secondary',
  onclick:   () => renderSetup()
}, '← Retaste Setup');

const cta = _el('div', { className: 'cta-bar' },
  _el('div', { className: 'cta-bar-inner' }, ctaBack, ctaBtn)
);

$screen().innerHTML = '';
$screen().appendChild(page);
$screen().appendChild(cta);

// Re-apply existing scratch scores if returning from Gap
for (const k of WN.C.DIM_KEYS) {
  if (_scratchScores[k] != null) _applyScore(k, _scratchScores[k]);
}
_updateSensoryProgress();
WN.ui._drawSpider(_scratchScores, draft.targetStyle);
```

}

function _buildDimCard(dimKey, styleKey) {
const def = WN.schema.dimensions[dimKey];
const card = _el(‘div’, { className: ‘dim-card’, id: ‘dim-card-’ + dimKey });

```
const header = _el('div', { className: 'dim-header' });
header.appendChild(_el('div', { className: 'dim-name' }, def.label));
const scoreDisp = _el('div', { className: 'dim-score-display', id: 'score-disp-' + dimKey }, '—');
header.appendChild(scoreDisp);
card.appendChild(header);

// Score buttons 1–5
const btns = _el('div', { className: 'score-buttons' });
for (let v = 1; v <= 5; v++) {
  const btn = _el('button', {
    className: 'score-btn',
    id: 'sb-' + dimKey + '-' + v
  }, String(v));
  const _v = v;
  btn.onclick = () => {
    _scratchScores[dimKey] = _v;
    _applyScore(dimKey, _v);
    _updateSensoryProgress();
    const draft = WN.session.getDraft();
    WN.ui._drawSpider(_scratchScores, draft ? draft.targetStyle : 'plush_napa');
  };
  btns.appendChild(btn);
}
card.appendChild(btns);

// Anchor text: 1 / 3 / 5
const anchors = _el('div', { className: 'dim-anchors' });
for (const v of [1, 3, 5]) {
  const a = _el('div', { className: 'anchor' });
  a.appendChild(_el('span', { className: 'anchor-label' }, String(v)));
  a.appendChild(document.createTextNode(def.anchors[v]));
  anchors.appendChild(a);
}
card.appendChild(anchors);

return card;
```

}

function _applyScore(dimKey, score) {
// Update button highlight
for (let v = 1; v <= 5; v++) {
const btn = document.getElementById(‘sb-’ + dimKey + ‘-’ + v);
if (btn) btn.classList.toggle(‘selected’, v === score);
}
// Update score display
const disp = document.getElementById(‘score-disp-’ + dimKey);
if (disp) {
disp.textContent = score;
disp.classList.add(‘has-score’);
}
// Mark card scored
const card = document.getElementById(‘dim-card-’ + dimKey);
if (card) card.classList.add(‘scored’);
}

function _updateSensoryProgress() {
const scored = WN.C.DIM_KEYS.filter(k => _scratchScores[k] != null).length;
const pct    = Math.round((scored / 8) * 100);
const fill   = document.getElementById(‘score-progress-fill’);
const label  = document.getElementById(‘score-progress-label’);
const cta    = document.getElementById(‘sensory-cta’);
if (fill)  fill.style.width = pct + ‘%’;
if (label) label.textContent = scored + ’ of 8’;
if (cta)   cta.disabled = scored < 8;
_setProgress(40 + pct * 0.2); // nav progress 40–60
}

// ─────────────────────────────────────────────────────────────────────────
// 12. SCREEN 4: GAP ANALYSIS
// ─────────────────────────────────────────────────────────────────────────

function renderGap() {
_state.screen = ‘gap’;
_state.history.push(‘sensory’);
_setNav(‘Gap Analysis’, true, 65);
_state.inRangeOpen = false;

```
const draft = WN.session.getDraft();
if (!draft || !draft.gapResults) { renderSensory(); return; }

const gap       = draft.gapResults;
const styleVec  = WN.schema.styleVectors[draft.targetStyle];
const page      = _el('div', { className: 'page' });

page.appendChild(_el('div', { className: 'page-title' }, draft.lotName));
page.appendChild(_el('div', { className: 'page-subtitle' }, (styleVec ? styleVec.label : draft.targetStyle) + ' · Gap Analysis'));

// Compound statement
const stmt = _el('div', { className: 'compound-statement' }, gap.compoundStatement);
page.appendChild(stmt);

// If compound rules fired, list them
if (gap.compoundFlags.length > 0) {
  const rulesWrap = _el('div', { style: 'margin-bottom: 20px;' });
  for (const cf of gap.compoundFlags) {
    const chip = _el('span', {
      className: 'status-badge tasted',
      style: 'margin-right:6px; margin-bottom:4px; display:inline-block;'
    }, cf.ruleId + ' · ' + cf.label);
    rulesWrap.appendChild(chip);
  }
  page.appendChild(rulesWrap);
}

// Flagged dimensions (sorted by boundaryGap desc)
if (gap.flaggedDimensions.length > 0) {
  page.appendChild(_el('div', { className: 'gap-section-label' }, 'Flagged Dimensions'));
  for (const k of gap.flaggedDimensions) {
    page.appendChild(_buildGapRow(k, gap.dimensions[k]));
  }
}

// In-range dimensions (collapsed by default)
const inRange = WN.C.DIM_KEYS.filter(k => gap.dimensions[k].withinRange);
if (inRange.length > 0) {
  const toggleBtn = _el('button', {
    className: 'in-range-toggle',
    id: 'in-range-toggle',
    onclick: () => {
      _state.inRangeOpen = !_state.inRangeOpen;
      const container = document.getElementById('in-range-rows');
      const lbl       = document.getElementById('in-range-toggle');
      if (container) container.style.display = _state.inRangeOpen ? 'block' : 'none';
      if (lbl) lbl.textContent = (_state.inRangeOpen ? '▲' : '▼') + ' ' + inRange.length + ' dimension' + (inRange.length > 1 ? 's' : '') + ' within range';
    }
  }, '▼ ' + inRange.length + ' dimension' + (inRange.length > 1 ? 's' : '') + ' within range');
  page.appendChild(toggleBtn);

  const inRangeContainer = _el('div', { id: 'in-range-rows', style: 'display:none;' });
  for (const k of inRange) {
    inRangeContainer.appendChild(_buildGapRow(k, gap.dimensions[k]));
  }
  page.appendChild(inRangeContainer);
}

// CTA
const ctaBtn = _el('button', {
  className: 'btn btn-primary',
  onclick: () => renderShortlist()
}, 'View Intervention Options →');

const ctaRetaste = _el('button', {
  className: 'btn btn-secondary',
  onclick:   () => renderSensory()
}, '← Retaste');

const cta = _el('div', { className: 'cta-bar' },
  _el('div', { className: 'cta-bar-inner' }, ctaRetaste, ctaBtn)
);

$screen().innerHTML = '';
$screen().appendChild(page);
$screen().appendChild(cta);
```

}

function _buildGapRow(dimKey, d) {
const sevCls = d.severity === ‘NONE’ ? ‘ok’ : d.severity.toLowerCase();
const row = _el(‘div’, { className: ’dim-gap-row ’ + sevCls });
row.appendChild(_el(‘div’, { className: ‘dim-gap-name’ }, WN.schema.dimensions[dimKey].label));

```
const scoreInfo = _el('div', { className: 'dim-gap-score' },
  d.score.toFixed(1) + '  [' + d.range.low.toFixed(1) + '–' + d.range.high.toFixed(1) + ']'
);
row.appendChild(scoreInfo);

const badge = _el('span', { className: 'dim-gap-badge ' + sevCls },
  d.severity === 'NONE' ? 'IN RANGE' : d.severity
);
row.appendChild(badge);

if (d.severity !== 'NONE' && d.boundaryGap > 0) {
  const lbl = _el('div', { className: 'dim-gap-label' },
    d.label + (d.boundaryGap > 0 ? ' (Δ' + d.boundaryGap.toFixed(2) + ')' : '')
  );
  row.appendChild(lbl);
}

return row;
```

}

// ─────────────────────────────────────────────────────────────────────────
// 13. SCREEN 5: SHORTLIST
// ─────────────────────────────────────────────────────────────────────────

function renderShortlist() {
_state.screen = ‘shortlist’;
_state.history.push(‘gap’);
_setNav(‘Intervention Options’, true, 85);
_state.selectedLeverKey = null;
_state.openLeverKey     = null;

```
const draft = WN.session.getDraft();
if (!draft || !draft.shortlist) { renderGap(); return; }

const shortlist = draft.shortlist;
const page = _el('div', { className: 'page' });

page.appendChild(_el('div', { className: 'page-title' }, 'Interventions'));
page.appendChild(_el('div', { className: 'page-subtitle' },
  shortlist.candidates.length + ' candidate' +
  (shortlist.candidates.length !== 1 ? 's' : '') +
  ' — ranked by gap coverage'
));

if (shortlist.candidates.length === 0) {
  const empty = _el('div', { className: 'empty-state', style: 'padding:40px 0;' });
  empty.innerHTML = '<p style="font-size:16px;">No eligible interventions</p><small>' +
    (shortlist.routingNotes || '') + '</small>';
  page.appendChild(empty);
} else {
  for (const candidate of shortlist.candidates) {
    page.appendChild(_buildLeverCard(candidate));
  }
}

// Rules triggered info
if (shortlist.triggeredRules.length > 0) {
  const info = _el('div', { className: 'gap-section-label', style: 'margin-top:24px;' },
    'Rules: ' + shortlist.triggeredRules.join(', ')
  );
  page.appendChild(info);
}

// Expert: style filters
if (_state.expertMode && shortlist.styleFiltersApplied.length > 0) {
  const ef = _el('div', { style: 'margin-top:8px; font-size:11px; color:var(--ink-dim);' },
    'Excluded by style filter: ' + shortlist.styleFiltersApplied.join(', ')
  );
  page.appendChild(ef);
}

// CTAs
const ctaSelect = _el('button', {
  className: 'btn btn-primary', id: 'shortlist-cta', disabled: true,
  onclick: () => {
    // Phase 5: Trial Planner. For V1 just save and confirm.
    draft.selectedLeverKey = _state.selectedLeverKey;
    WN.session.save();
    _toast('Intervention selected. Trial builder coming in Phase 5.');
  }
}, 'Plan Trial →');

const ctaSave = _el('button', {
  className: 'btn btn-secondary',
  onclick: () => {
    WN.session.save();
    _toast('Session saved');
    setTimeout(() => renderDashboard(), 800);
  }
}, 'Save Without Trial');

const cta = _el('div', { className: 'cta-bar' },
  _el('div', { className: 'cta-bar-inner' }, ctaSave, ctaSelect)
);

$screen().innerHTML = '';
$screen().appendChild(page);
$screen().appendChild(cta);
```

}

function _buildLeverCard(c) {
const card = _el(‘div’, { className: ‘lever-card’, id: ‘lever-card-’ + c.leverKey });

```
// Header — tap to expand
const header = _el('button', { className: 'lever-header', onclick: () => _toggleLever(c.leverKey) });
header.appendChild(_el('span', { className: 'lever-rank' }, '#' + c.rank));

const nameWrap = _el('div', { style: 'flex:1; min-width:0;' });
nameWrap.appendChild(_el('div', { className: 'lever-name' }, c.title));
if (_state.expertMode) {
  nameWrap.appendChild(_el('div', {
    style: 'font-size:10px; color:var(--ink-dim); margin-top:2px; letter-spacing:0.08em;'
  }, 'Score: ' + c.score.toFixed(1) + ' · ' + c.rules.join(', ')));
}
header.appendChild(nameWrap);

const hCls = _horizonClass(c.timeHorizon);
header.appendChild(_el('span', { className: 'lever-horizon ' + hCls }, _horizonLabel(c.timeHorizon)));
card.appendChild(header);

// Body — hidden by default
const body = _el('div', { className: 'lever-body', id: 'lever-body-' + c.leverKey });

if (c.reasons.length > 0) {
  const sec = _el('div', { className: 'lever-section' });
  sec.appendChild(_el('div', { className: 'lever-section-label' }, 'Why this lever'));
  const ul = _el('ul', { className: 'lever-reasons' });
  for (const r of c.reasons) ul.appendChild(_el('li', {}, r));
  sec.appendChild(ul);
  body.appendChild(sec);
}

if (c.warnings.length > 0) {
  const sec = _el('div', { className: 'lever-section' });
  sec.appendChild(_el('div', { className: 'lever-section-label' }, 'Risks & cautions'));
  const ul = _el('ul', { className: 'lever-warnings' });
  for (const w of c.warnings) ul.appendChild(_el('li', {}, w));
  sec.appendChild(ul);
  body.appendChild(sec);
}

if (c.prerequisites.length > 0) {
  const sec = _el('div', { className: 'lever-section' });
  sec.appendChild(_el('div', { className: 'lever-section-label' }, 'Prerequisites'));
  const ul = _el('ul', { className: 'lever-prereqs' });
  for (const p of c.prerequisites) ul.appendChild(_el('li', {}, p));
  sec.appendChild(ul);
  body.appendChild(sec);
}

// Select button
const selBtn = _el('button', {
  className: 'lever-select-btn', id: 'lever-sel-' + c.leverKey,
  onclick: (e) => {
    e.stopPropagation();
    _selectLever(c.leverKey);
  }
}, 'Select for Trial');
body.appendChild(selBtn);
card.appendChild(body);

return card;
```

}

function _toggleLever(leverKey) {
const wasOpen = _state.openLeverKey === leverKey;
// Close all
WN.session.getDraft()?.shortlist?.candidates?.forEach(c => {
const b = document.getElementById(‘lever-body-’ + c.leverKey);
if (b) b.classList.remove(‘open’);
});
_state.openLeverKey = null;
if (!wasOpen) {
const body = document.getElementById(‘lever-body-’ + leverKey);
if (body) body.classList.add(‘open’);
_state.openLeverKey = leverKey;
}
}

function _selectLever(leverKey) {
_state.selectedLeverKey = leverKey;
// Update all cards
document.querySelectorAll(’.lever-card’).forEach(el => el.classList.remove(‘selected-lever’));
document.querySelectorAll(’.lever-select-btn’).forEach(b => b.classList.remove(‘active’));
const card = document.getElementById(‘lever-card-’ + leverKey);
if (card) card.classList.add(‘selected-lever’);
const btn = document.getElementById(‘lever-sel-’ + leverKey);
if (btn) btn.classList.add(‘active’);
// Enable Plan Trial CTA
const cta = document.getElementById(‘shortlist-cta’);
if (cta) cta.disabled = false;
}

// ─────────────────────────────────────────────────────────────────────────
// 14. SPIDER CHART (Canvas, no libraries)
// ─────────────────────────────────────────────────────────────────────────

WN.ui._drawSpider = function (scores, styleKey) {
const canvas = document.getElementById(‘radar-canvas’);
if (!canvas) return;
const ctx = canvas.getContext(‘2d’);
const W = canvas.width, H = canvas.height;
const cx = W / 2, cy = H / 2;
const R  = Math.min(W, H) / 2 - 30;
const N  = WN.C.DIM_KEYS.length;

```
ctx.clearRect(0, 0, W, H);

// Short labels for axes
const shortLabels = ['Acid', 'Tannin', 'Drying', 'Density', 'Sweet', 'Aroma', 'Finish', 'Weight'];

// Helpers
function point(i, r) {
  const angle = (Math.PI * 2 * i / N) - Math.PI / 2;
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

// Draw grid rings (1–5)
for (let ring = 1; ring <= 5; ring++) {
  const r = R * ring / 5;
  ctx.beginPath();
  for (let i = 0; i < N; i++) {
    const p = point(i, r);
    i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();
  ctx.strokeStyle = ring === 5 ? '#2a2420' : '#1e1b18';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Ring number label at top
  if (ring % 2 === 0) {
    ctx.fillStyle = '#3a3330';
    ctx.font = '8px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(String(ring), cx, cy - r + 3);
  }
}

// Draw spokes
for (let i = 0; i < N; i++) {
  const p = point(i, R);
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(p.x, p.y);
  ctx.strokeStyle = '#2a2420';
  ctx.lineWidth = 0.5;
  ctx.stroke();
}

// Draw target range band (fill between low and high)
const vector = WN.schema.styleVectors[styleKey];
if (vector) {
  ctx.beginPath();
  for (let i = 0; i < N; i++) {
    const k = WN.C.DIM_KEYS[i];
    const rng = vector.dimensions[k];
    const r = R * rng.high / 5;
    const p = point(i, r);
    i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(200,164,110,0.06)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(200,164,110,0.2)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.beginPath();
  for (let i = 0; i < N; i++) {
    const k = WN.C.DIM_KEYS[i];
    const rng = vector.dimensions[k];
    const r = R * rng.low / 5;
    const p = point(i, r);
    i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();
  ctx.strokeStyle = 'rgba(200,164,110,0.15)';
  ctx.lineWidth = 0.75;
  ctx.stroke();
}

// Draw scored polygon
const completedKeys = WN.C.DIM_KEYS.filter(k => scores[k] != null);
if (completedKeys.length >= 3) {
  ctx.beginPath();
  let started = false;
  for (let i = 0; i < N; i++) {
    const k = WN.C.DIM_KEYS[i];
    if (scores[k] == null) continue;
    const r = R * scores[k] / 5;
    const p = point(i, r);
    if (!started) { ctx.moveTo(p.x, p.y); started = true; }
    else ctx.lineTo(p.x, p.y);
  }
  if (completedKeys.length === N) ctx.closePath();
  ctx.fillStyle = 'rgba(200,164,110,0.15)';
  ctx.fill();
  ctx.strokeStyle = '#c8a46e';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

// Draw dots for scored points
for (let i = 0; i < N; i++) {
  const k = WN.C.DIM_KEYS[i];
  if (scores[k] == null) continue;
  const r = R * scores[k] / 5;
  const p = point(i, r);
  ctx.beginPath();
  ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);

  // Color dot by flag severity if we have gap results
  const draft = WN.session.getDraft();
  let dotColor = '#c8a46e';
  if (draft && draft.gapResults) {
    const dim = draft.gapResults.dimensions[k];
    if (dim) {
      if (dim.severity === 'MAJOR')    dotColor = '#c04a3a';
      else if (dim.severity === 'MODERATE') dotColor = '#b07830';
      else if (dim.severity === 'MINOR')    dotColor = '#8a8050';
      else dotColor = '#4a7a50';
    }
  }
  ctx.fillStyle = dotColor;
  ctx.fill();
}

// Draw axis labels
const labelR = R + 18;
for (let i = 0; i < N; i++) {
  const p = point(i, labelR);
  ctx.fillStyle = '#6a5e52';
  ctx.font = '9px Courier New';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(shortLabels[i], p.x, p.y);
}
```

};

// ─────────────────────────────────────────────────────────────────────────
// 15. NAVIGATION
// ─────────────────────────────────────────────────────────────────────────

function goBack() {
const prev = _state.history.pop();
if (!prev || prev === ‘dashboard’) { renderDashboard(); return; }
if (prev === ‘setup’)     { renderSetup();     return; }
if (prev === ‘sensory’)   { renderSensory();   return; }
if (prev === ‘gap’)       { renderGap();       return; }
renderDashboard();
}

function toggleExpertMode() {
_state.expertMode = !_state.expertMode;
const appState = WN.storage.loadAppState();
appState.expertMode = _state.expertMode;
WN.storage.saveAppState(appState);
// Re-render current screen
document.body.classList.toggle(‘expert-mode’, _state.expertMode);
const ep = document.getElementById(‘nav-expert’);
if (ep) ep.classList.toggle(‘active’, _state.expertMode);
// Full re-render so expert fields appear/disappear
const screen = _state.screen;
if (screen === ‘setup’)    renderSetup();
else if (screen === ‘sensory’)  renderSensory();
else if (screen === ‘gap’)      renderGap();
else if (screen === ‘shortlist’)renderShortlist();
}

// ─────────────────────────────────────────────────────────────────────────
// 16. PUBLIC API
// ─────────────────────────────────────────────────────────────────────────

return {
// Screens
renderDashboard,
renderSetup,
renderSensory,
renderGap,
renderShortlist,
// Nav
goBack,
toggleExpertMode,
// Exposed for canvas redraws
_drawSpider: WN.ui._drawSpider
};

})();

// ─────────────────────────────────────────────────────────────────────────────
// 16. INIT
// ─────────────────────────────────────────────────────────────────────────────

document.addEventListener(‘DOMContentLoaded’, function () {
// Restore expert mode state
const appState = WN.storage.loadAppState();
if (appState.expertMode) {
document.body.classList.add(‘expert-mode’);
const ep = document.getElementById(‘nav-expert’);
if (ep) ep.classList.add(‘active’);
}

WN.ui.renderDashboard();
});
