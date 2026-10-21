/* The city map and the numbers everything else is measured in.
   One tile is TS x TS voxels; the map is GRID x GRID tiles. The timeline runs 0..T_END (this year to YEAR_SPAN years from now) and
   each tile takes TD to convert. Map codes: W wind, S solar, N nuclear, G garden, F forest, R river,
   T towers, M mid-rise, anything else (L, r) low-rise. Tiles on a rail line (LINES in rail.js) become
   rail tiles whatever their code.
   The layout is a loose Atlanta, north at the top: the Chattahoochee down the north-west edge, tower
   clusters at Buckhead, Midtown and Downtown along a Peachtree spine, Piedmont Park, the airport's
   flat land to the south and the South River Forest to the south-east. */

const TS = 20, GRID = 10, MAXY = 44, TD = 2.4, T_END = 30;
const START_YEAR = new Date().getFullYear(), YEAR_SPAN = 50;
const MAP = [
  'FFFRRrTMLW',
  'FFRRRrTMLW',
  'FRRLLrMGLW',
  'FRRLTrTGGS',
  'NRLMMrMLLS',
  'rrrrrrrrrr',
  'RRLMTrTLGF',
  'RRLLMrLLFF',
  'RFLSrrLFFW',
  'FFSSrSSLFW'
];
const KIND = { W: 'wind', S: 'solar', N: 'nuclear', G: 'garden', F: 'forest', R: 'river' };
const GREEN_BASE = '#78b552';
/* calendar year at timeline time tt */
function yearAt(tt) { return Math.round(START_YEAR + YEAR_SPAN * Math.min(Math.max(tt / T_END, 0), 1)); }
function codeAt(c, r) { return (c < 0 || r < 0 || c >= GRID || r >= GRID) ? '' : MAP[r].charAt(c); }

export { TS, GRID, MAXY, TD, T_END, START_YEAR, MAP, KIND, GREEN_BASE, yearAt, codeAt };
