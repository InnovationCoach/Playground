/**
 * The Junior Explorers activity list, in teaching order.
 *
 * Each primary activity is the hands-on version of the secondary activity with
 * the same number. `investigations` present = playable; absent = planned, shown
 * as "coming soon". All eight are playable since 2026-09-27.
 */
import { EXPERIMENTS as PLANT_EXPERIMENTS } from '../../activities/plantLab/plantLabModel.js';
import { FLOATING_HOUSE } from './floatingHouse.js';
import { HOT_SPOTS } from './hotSpots.js';
import { STORM_SHELTER } from './stormShelter.js';
import { MICROBIT_BLOCKS } from './microbitBlocks.js';
import { MANGROVES } from './mangroves.js';
import { SUN_POWER } from './sunPower.js';
import { ACID_RAIN } from './acidRain.js';

export const JUNIOR_ACTIVITIES = [
  HOT_SPOTS,
  STORM_SHELTER,
  MICROBIT_BLOCKS,
  MANGROVES,
  SUN_POWER,
  ACID_RAIN,
  { id: 'plant-lab', number: 7, icon: '🔬', colour: '#22c55e', title: 'Plant Microscope Lab',
    short: 'Look at leaves, stems, roots and petals under the microscope.', kit: 'microscope',
    story: 'Plants are made of tiny parts called cells. Let\'s look inside them with the microscope!',
    investigations: PLANT_EXPERIMENTS },
  FLOATING_HOUSE
];

export const JUNIOR_BY_ID = new Map(JUNIOR_ACTIVITIES.map((a) => [a.id, a]));
export const isPlayable = (activity) => Array.isArray(activity.investigations) && activity.investigations.length > 0;
