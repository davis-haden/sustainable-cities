/* The city map and the numbers everything else is measured in.
   One tile is TS x TS voxels; the map is GRID x GRID tiles. The timeline runs 0..T_END (2000..2050) and
   each tile takes TD to convert. Map codes: W wind, S solar, N nuclear, G garden, F forest, R river,
   T towers, M mid-rise, anything else (L, r) low-rise. Tiles on a rail line (LINES in rail.js) become
   rail tiles whatever their code. */

const TS = 20, GRID = 10, MAXY = 28, TD = 2.4, T_END = 30;
const MAP = [
  'FFWWrRRNWW',
  'FWWFrrrrSW',
  'WFLRRRGrSS',
  'WrLRRMTrrr',
  'FrRRMTrrrS',
  'FrrrrrrrrS',
  'GLRRMTrTMG',
  'FRRRLrrMGS',
  'RRFLLrGLSS',
  'RFFGLrLSSW'
];
const KIND = { W: 'wind', S: 'solar', N: 'nuclear', G: 'garden', F: 'forest', R: 'river' };
const GREEN_BASE = '#78b552';
function codeAt(c, r) { return (c < 0 || r < 0 || c >= GRID || r >= GRID) ? '' : MAP[r].charAt(c); }

export { TS, GRID, MAXY, TD, T_END, MAP, KIND, GREEN_BASE, codeAt };
