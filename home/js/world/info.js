/* What each tile is called and the facts shown in its details card. Edit copy here. */
import { hash } from '../lib/util.js';
import { RAIL, STATIONS } from './rail.js';

export const PHASE_NAMES = ['clean power', 'light rail', 'nature'];

const NAMES = { wind: 'Wind turbine', solar: 'Solar array', nuclear: 'Nuclear reactor', garden: 'Community garden', forest: 'Urban forest', river: 'Restored river', rail: 'Light rail', station: 'Light-rail station', bridge: 'Light-rail bridge', hub: 'Interchange station' };
function oldName(t) {
  var R = RAIL[t.c + ',' + t.r], v = Math.floor(hash(t.c * 3 + 1, t.r * 7 + 2, 4) * 4);
  if (R) return R.lines.length > 1 ? 'Road junction' : (R.term ? 'Road turnaround' : (STATIONS[R.key] ? 'Gas station' : 'Arterial road'));
  if (t.code === 'N') return 'Coal power station';
  if (t.code === 'W') return ['Factory', 'Tank farm', 'Scrapyard', 'Factory'][v];
  if (t.code === 'S') return ['Coal power station', 'Factory', 'Tank farm', 'Scrapyard'][v];
  return { G: 'Vacant lot', F: 'Clear-cut land', R: 'Polluted river' }[t.code] || 'City block';
}

/* the Atlanta neighbourhood or landmark each tile stands in for, keyed 'col,row'; tiles not listed show only their label */
const AREAS = [
  ['Buckhead', ['5,1', '6,0', '6,1', '7,0', '7,1', '8,0', '8,1']],
  ['North Springs', ['5,0']],
  ['Midtown', ['4,3', '5,2', '5,3', '6,2', '6,3', '4,2']],
  ['Piedmont Park', ['7,2', '7,3', '8,3']],
  ['Downtown', ['4,4', '5,4', '6,4', '4,6', '5,6', '6,6']],
  ['Five Points', ['5,5']],
  ['Vine City', ['3,5', '2,5', '3,4']],
  ['West End', ['5,7', '2,6', '3,6', '2,7', '3,7', '4,7']],
  ['Old Fourth Ward', ['7,4', '6,5', '7,5']],
  ['Inman Park', ['8,4']],
  ['Decatur', ['8,5']],
  ['Indian Creek', ['9,5']],
  ['H. E. Holmes', ['0,5']],
  ['Grant Park', ['7,6', '8,6', '6,7', '7,7']],
  ['Chattahoochee River', ['3,0', '4,0', '2,1', '3,1', '4,1', '1,2', '2,2', '1,3', '2,3', '1,4', '1,5', '0,6', '1,6', '0,7', '1,7', '0,8']],
  ['South River Forest', ['9,6', '8,7', '9,7', '7,8', '8,8', '8,9']],
  ['Hartsfield-Jackson', ['4,9', '4,8', '5,8', '3,8', '2,9', '3,9', '5,9', '6,9']]
];
const PLACES = {};
AREAS.forEach(function (a) { a[1].forEach(function (k) { PLACES[k] = a[0]; }); });
function placeName(t) { return PLACES[t.c + ',' + t.r] || ''; }

const INFO = {
  wind: {
    tag: 'Renewable',
    blurb: 'A 2 MW onshore turbine. Three blades turn a generator once the wind passes about 3 m/s. It reaches full output near 12 m/s and shuts down above 25 m/s to protect itself.',
    stats: [['Rated power', '2 MW (onshore turbines are typically 2 to 3 MW)'], ['Annual output', 'About 6 GWh at a 35% capacity factor'], ['Homes powered', 'Roughly 550 to 600 average US homes'], ['Lifecycle emissions', 'About 11 g CO₂e per kWh, against about 820 for coal']]
  },
  solar: {
    tag: 'Renewable',
    blurb: 'Rows of photovoltaic panels tilted toward the sun turn light directly into electricity, with no moving parts. A tile this size is one hectare, which holds roughly half a megawatt of ground-mounted panels.',
    stats: [['Capacity', 'About 0.5 MW per hectare of panels'], ['Annual output', 'About 1.1 GWh at a 25% capacity factor'], ['Homes powered', 'Roughly 100 average US homes'], ['Lifecycle emissions', 'About 48 g CO₂e per kWh for utility-scale solar']]
  },
  nuclear: {
    tag: 'Low-carbon',
    blurb: 'Fission heats water inside the concrete containment dome to make steam that spins a turbine. The wide tower cools the used steam, so the white plume above it is water vapor, not smoke. It runs day and night, filling in when wind and sun are low.',
    stats: [['Typical unit size', 'About 1,000 MW for a large reactor'], ['Capacity factor', 'Above 90% for the US fleet'], ['Annual output', 'About 8 TWh from one 1,000 MW unit'], ['Homes powered', 'Roughly 750,000 average US homes'], ['Lifecycle emissions', 'About 12 g CO₂e per kWh']]
  },
  garden: {
    tag: 'Green space',
    blurb: 'Gardens, orchards and meadows soak up rain that would otherwise run off paved streets, cool the blocks around them, and give residents fresh food and a place to meet. Flowers here also feed pollinators such as bees.',
    stats: [['Cooling', 'Shaded surfaces can be 11 to 25 °C cooler than sunlit ones (US EPA)'], ['Carbon', 'A mature tree absorbs roughly 22 kg of CO₂ a year (commonly cited estimate)'], ['Stormwater', 'Soil and plants hold rain that would flood storm drains'], ['Food', 'Beds and orchards supply produce close to where it is eaten']]
  },
  rail: {
    tag: 'Clean transit',
    blurb: 'Light rail is the only road in this city. There are no cars, only electric trains drawing power from overhead wires. Charged by the grid you see around it, each trip has no tailpipe emissions.',
    stats: [['Capacity', 'Roughly 5,000 to 15,000 riders per hour in each direction'], ['Train size', 'A light-rail car carries about 150 to 200 riders, seated and standing'], ['Space', 'One track carries as many people as several lanes of cars'], ['Emissions', 'Zero tailpipe emissions, electric traction']]
  }
};
INFO.station = {
  tag: 'Clean transit',
  blurb: 'A light-rail stop with a canopy covered in solar panels, so the station helps power the line it serves. Riders step straight from the platform onto the train, and the lawns around it keep the tracks green.',
  stats: INFO.rail.stats
};
INFO.bridge = {
  tag: 'Clean transit',
  blurb: 'The light rail crosses the river on a low bridge. Before, this was a four-lane road bridge over a concrete channel. Now trains carry people across while the restored banks below stay open for wildlife and walkers.',
  stats: INFO.rail.stats
};
INFO.hub = {
  tag: 'Clean transit',
  blurb: 'The two light-rail lines cross here, under a glass and solar roof. Riders change lines on the platforms, and the trains take turns through the crossing. It sits at Five Points, where the busiest road junction used to be.',
  stats: [['Lines', 'Two lines, one running east to west and one north to south'], ['Roof', 'Solar panels alternate with glass to light the platforms'], ['Transfers', 'Changing lines takes a short walk across the platform'], ['Emissions', 'Zero tailpipe emissions, electric traction']]
};
INFO.river = {
  tag: 'Nature',
  blurb: 'The river used to run in a concrete channel past drain pipes. The walls have come out, and planted banks, reeds and riverside trees now filter runoff and shade the water. The banks also act as a floodplain that soaks up storm water.',
  stats: [['Flooding', 'Floodplains store water that would otherwise rush into streets'], ['Water quality', 'Plants on the banks trap sediment and fertilizer before they reach the water'], ['Habitat', 'Shaded, cooler water holds more oxygen for fish'], ['Real example', "Seoul uncovered its Cheonggyecheon stream from beneath an elevated highway in 2005"]]
};
INFO.forest = {
  tag: 'Nature',
  blurb: 'Where there was clear-cut, muddy logging ground, a mixed wood of broadleaf trees and pines has grown back. It spreads across tile edges the way real woods do. It stores carbon, cools the air, and connects green space for birds and animals.',
  stats: [['Carbon', 'A mature tree absorbs roughly 22 kg of CO₂ a year (commonly cited estimate)'], ['Cooling', 'Tree canopy can lower nearby air temperature by a few degrees on hot days'], ['Air', 'Leaves trap fine particle pollution'], ['Habitat', 'Native trees support birds, insects and mammals']]
};

export { NAMES, INFO, oldName, placeName };
