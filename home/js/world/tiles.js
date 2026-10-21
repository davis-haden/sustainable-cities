/* Builds the "after" (makeNew) and "before" (makeOld) version of one map tile from its map code. */
import { hash } from '../lib/util.js';
import { RAIL } from './rail.js';
import { TB } from './tile-builder.js';
import { buildWind, buildSolar, buildNuclear, buildGarden, buildTower, buildMid, buildLow } from './green-tiles.js';
import { buildCoal, buildFactory, buildTanks, buildScrap, buildLot } from './polluted-tiles.js';
import { plantTrees, floorTint, buildForest, buildRiver, buildOldRiver, buildClearcut } from './nature.js';
import { railTile } from './rail-tiles.js';

function rotFor(code, c, r) { return 'GTML'.indexOf(code) >= 0 ? Math.floor(hash(c + 0.3, r + 0.7, 31) * 4) % 4 : 0; }
function makeNew(code, c, r) {
  var tb = new TB(c, r, rotFor(code, c, r)), R = RAIL[c + ',' + r];
  if (R) railTile(tb, R, false);
  else if (code === 'W') { buildWind(tb); plantTrees(tb, 0.3, 0.5); }
  else if (code === 'S') buildSolar(tb);
  else if (code === 'N') buildNuclear(tb);
  else if (code === 'G') { buildGarden(tb); plantTrees(tb, 0.3, 0.5); }
  else if (code === 'F') buildForest(tb);
  else if (code === 'R') buildRiver(tb);
  else if (code === 'T') buildTower(tb);
  else if (code === 'M') buildMid(tb);
  else { buildLow(tb); plantTrees(tb, 0.3, 0.5); }
  floorTint(tb);
  return tb;
}
function makeOld(code, c, r) {
  var tb = new TB(c, r, rotFor(code, c, r)), R = RAIL[c + ',' + r], v = Math.floor(hash(c * 3 + 1, r * 7 + 2, 4) * 4);
  if (R) railTile(tb, R, true);
  else if (code === 'N') buildCoal(tb, 3);
  else if (code === 'W') [buildFactory, buildTanks, buildScrap, buildFactory][v](tb);
  else if (code === 'S') { if (v === 0) buildCoal(tb, 2); else [null, buildFactory, buildTanks, buildScrap][v](tb); }
  else if (code === 'G') buildLot(tb);
  else if (code === 'F') buildClearcut(tb);
  else if (code === 'R') buildOldRiver(tb);
  else {
    tb.dull = true;
    if (code === 'T') buildTower(tb); else if (code === 'M') buildMid(tb); else buildLow(tb);
  }
  return tb;
}

export { makeNew, makeOld };
