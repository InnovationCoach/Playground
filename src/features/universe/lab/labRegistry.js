/**
 * Extensible AI Research Lab Registry (Part 7.1).
 * New laboratories can be registered here without redesigning the lab host or backend.
 */

export const LAB_TYPES = [
  { id: 'engineering', name: 'Engineering Lab', description: 'Spaceships, vehicles, and robotic habitats.', active: true, flagshipProjectId: 'spaceship-builder' },
  { id: 'environmental', name: 'Environmental Lab', description: 'Water filtration and renewable energy.', active: false },
  { id: 'biology', name: 'Biology Lab', description: 'Ecosystems, food webs, and biodiversity.', active: false },
  { id: 'physics', name: 'Physics Lab', description: 'Bridges, structures, and propulsion.', active: false },
  { id: 'space-research', name: 'Space Research Lab', description: 'Satellites and deep-space exploration systems.', active: false },
  { id: 'innovation', name: 'Innovation Lab', description: 'Original learner inventions.', active: false }
];
