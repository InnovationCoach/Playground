import { describe, expect, it } from 'vitest';
import { buildCosmos, validateCatalog } from '../src/features/universe/explore/cosmosCatalog.js';
import catalogV2 from '../public/cosmos/v2/catalog.json';
import {
  assignCrewTask,
  buildFeature,
  claimPlanet,
  completeGoal,
  cultivateLife,
  generateCrewBriefing,
  getPlanetRecord,
  initialPlaygroundState,
  investigatePlanet,
  resolvePlanetHazard,
  runWeeklyUniverseEvent
} from '../src/features/universe/playground/playgroundModel.js';

describe('My Universe v2 Playground Catalog', () => {
  it('validates cleanly with at least 3 galaxies, star systems, and 14+ distinct exoplanets', () => {
    expect(validateCatalog(catalogV2)).toEqual([]);
    const cosmos = buildCosmos(catalogV2);
    expect(cosmos.galaxies.length).toBeGreaterThanOrEqual(3);
    expect(cosmos.systems.length).toBeGreaterThanOrEqual(6);
    expect(cosmos.planets.length).toBeGreaterThanOrEqual(14);
    expect(cosmos.planets.every((p) => p.access === 'public' && !!p.environmentId)).toBe(true);

    // Every exoplanet must be unique in name, base color, radius, summary, and environment biome
    const n = cosmos.planets.length;
    expect(new Set(cosmos.planets.map((p) => p.name)).size).toBe(n);
    expect(new Set(cosmos.planets.map((p) => p.colors.base)).size).toBe(n);
    expect(new Set(cosmos.planets.map((p) => p.radius)).size).toBe(n);
    expect(new Set(cosmos.planets.map((p) => p.summary)).size).toBe(n);
    expect(new Set(cosmos.environments.map((e) => e.biome)).size).toBe(n);

    // Every exoplanet has a unique starting trait and stat/atmosphere signature
    const records = cosmos.planets.map((p) => getPlanetRecord(initialPlaygroundState(p.id), p.id));
    expect(new Set(records.map((r) => r.trait)).size).toBe(n);
    expect(new Set(records.map((r) => `${r.habitability}-${r.biodiversity}-${r.shielding}-${r.atmosphere.o2}`)).size).toBe(n);
  });
});

describe('Learner Playground Engine', () => {
  const cosmos = buildCosmos(catalogV2);

  it('awards credits when learners achieve goals and allows claiming any of the 15 exoplanets', () => {
    let state = initialPlaygroundState('thalassa');
    expect(state.credits).toBe(100);

    state = completeGoal(state, 'goal-pbl-milestone');
    expect(state.credits).toBe(180);

    state = claimPlanet(state, 'nyxara');
    expect(state.claimedPlanetId).toBe('nyxara');
    expect(getPlanetRecord(state, 'nyxara').habitability).toBe(21);
    expect(getPlanetRecord(state, 'nyxara').shielding).toBe(28);
  });

  it('investigates planets to find living things, cultivates life, and builds new features with credits', () => {
    let state = initialPlaygroundState('thalassa');
    const thalassa = cosmos.planetById('thalassa');

    const scan = investigatePlanet(state, thalassa);
    expect(scan.discovered).not.toBeNull();
    state = scan.state;
    expect(getPlanetRecord(state, 'thalassa').discoveredSpecies).toContain(scan.discovered.id);

    const cult = cultivateLife(state, 'thalassa', scan.discovered.id);
    expect(cult.ok).toBe(true);
    state = cult.state;
    expect(state.credits).toBe(75);
    expect(getPlanetRecord(state, 'thalassa').biodiversity).toBeGreaterThan(10);

    const built = buildFeature(state, 'thalassa', 'geodesic-biodome');
    expect(built.ok).toBe(true);
    state = built.state;
    expect(state.credits).toBe(30);
    expect(getPlanetRecord(state, 'thalassa').features).toContain('geodesic-biodome');
  });

  it('governs AI NPC crew assignments and generates role-aware briefings', () => {
    let state = initialPlaygroundState('ignis');
    state = assignCrewTask(state, 'ignis', 'soren-hale', 'shield');
    const record = getPlanetRecord(state, 'ignis');
    const soren = record.crew.find((c) => c.id === 'soren-hale');
    expect(soren.task).toBe('shield');
    expect(soren.morale).toBeGreaterThan(80);

    const briefing = generateCrewBriefing(record, 'Ignis');
    expect(briefing.length).toBeGreaterThanOrEqual(2);
    expect(briefing.some((line) => line.includes('Ignis'))).toBe(true);
  });

  it('triggers weekly Universe Creator hazards on exactly 3 random planets and allows resolution', () => {
    let state = initialPlaygroundState('thalassa');
    const allIds = cosmos.planets.map((p) => p.id);

    state = runWeeklyUniverseEvent(state, allIds, { seed: 42 });
    expect(state.week).toBe(2);
    expect(state.weeklyBulletin).toHaveLength(3);

    const hitIds = state.weeklyBulletin.map((e) => e.planetId);
    expect(new Set(hitIds).size).toBe(3);

    const targetId = hitIds[0];
    expect(getPlanetRecord(state, targetId).activeHazard).not.toBeNull();

    const resolved = resolvePlanetHazard(state, targetId, 'crew');
    expect(resolved.ok).toBe(true);
    expect(getPlanetRecord(resolved.state, targetId).activeHazard).toBeNull();
  });

  it('enforces trophic food-web prerequisites, star-class solar modifiers, and atmosphere O2 fire risk', async () => {
    const { fireRiskForRecord, starModifiersForClass } = await import('../src/features/universe/playground/playgroundModel.js');
    let state = initialPlaygroundState('thalassa');
    const thalassa = cosmos.planetById('thalassa');

    // Scan 1: Bioluminescent Kelp (Flora); Scan 2: Pelagic Lantern-Jellies (Fauna)
    state = investigatePlanet(state, thalassa).state;
    state = investigatePlanet(state, thalassa).state;

    // Cannot cultivate Fauna before a Flora/Microbe producer is cultivated
    const faunaFirst = cultivateLife(state, 'thalassa', 'pelagic-jellies');
    expect(faunaFirst.ok).toBe(false);
    expect(faunaFirst.reason).toBe('needs-producer');

    // Cultivate Flora producer first, then Fauna succeeds
    state = cultivateLife(state, 'thalassa', 'biolume-kelp').state;
    const faunaAfter = cultivateLife(state, 'thalassa', 'pelagic-jellies');
    expect(faunaAfter.ok).toBe(true);
    state = faunaAfter.state;

    // Star-class physics: A-type star gives 1.5x solar bonus vs M-type 0.6x
    expect(starModifiersForClass('Blue-white star (A-type)').solarBonus).toBe(1.5);
    expect(starModifiersForClass('Red dwarf (M-type)').solarBonus).toBe(0.6);

    const aBuild = buildFeature(state, 'thalassa', 'solar-float-array', { starClass: 'Blue-white star (A-type)' });
    expect(aBuild.ok).toBe(true);
    // 10 * 1.5 = +15 habitability on top of existing habitability
    expect(getPlanetRecord(aBuild.state, 'thalassa').habitability).toBe(getPlanetRecord(state, 'thalassa').habitability + 15);

    // High O2 (>28%) without fire suppression triggers Elevated fire risk
    const highO2 = { atmosphere: { o2: 31, co2: 9, n2: 60 }, features: [] };
    expect(fireRiskForRecord(highO2).level).toBe('Elevated');
    expect(fireRiskForRecord({ ...highO2, features: ['fire-suppression-bots'] }).level).toBe('Nominal');
  });

  it('builds 2-option crew dilemmas, records Captain Log entries, and provides AI crew advisor fallback', async () => {
    const { buildHazardDilemma, resolveHazardWithDilemma } = await import('../src/features/universe/playground/playgroundModel.js');
    const { fetchCrewAdvisorReply } = await import('../src/features/universe/playground/crewAdvisor.js');

    let state = initialPlaygroundState('thalassa');
    state = runWeeklyUniverseEvent(state, cosmos.planets.map((p) => p.id), { seed: 7 });
    const hitId = state.weeklyBulletin[0].planetId;
    const hitHazard = getPlanetRecord(state, hitId).activeHazard;

    const options = buildHazardDilemma(hitHazard, hitId);
    expect(options).toHaveLength(2);
    expect(options.map((o) => o.id)).toEqual(['engineering', 'ecological']);

    const resolved = resolveHazardWithDilemma(
      state,
      hitId,
      'ecological',
      'We chose ecological adaptation to preserve biodiversity and gather research telemetry.',
      hitId
    );
    expect(resolved.ok).toBe(true);
    expect(getPlanetRecord(resolved.state, hitId).activeHazard).toBeNull();
    expect(resolved.state.captainsLog).toHaveLength(1);
    expect(resolved.state.captainsLog[0].reasoning).toContain('preserve biodiversity');

    const advisor = await fetchCrewAdvisorReply({
      planet: cosmos.planetById('thalassa'),
      system: cosmos.systemById('lyra-prime'),
      record: getPlanetRecord(resolved.state, 'thalassa'),
      question: 'How do we grow life safely?',
      useRemote: false
    });
    expect(advisor.source).toBe('local');
    expect(advisor.reply).toContain('trophic food-web');
  });

  it('syncs real SPARK goals idempotently and supports classroom co-op aid on weekly hazard planets', async () => {
    const { syncAchievedGoals, sendPlanetaryAid, stewardForPlanet } = await import('../src/features/universe/playground/playgroundModel.js');

    let state = initialPlaygroundState('thalassa');
    expect(stewardForPlanet('thalassa', state)).toBe('You');
    expect(stewardForPlanet('aurelia', state)).toBe('Maya L.');

    // Sync two real SPARK goals (+100 Cr total)
    const firstSync = syncAchievedGoals(state, ['goal-1', 'goal-2']);
    expect(firstSync.newlyAwarded).toBe(2);
    expect(firstSync.state.credits).toBe(200);
    state = firstSync.state;

    // Re-syncing the same goal IDs is idempotent (0 newlyAwarded)
    const secondSync = syncAchievedGoals(state, ['goal-1', 'goal-2']);
    expect(secondSync.newlyAwarded).toBe(0);
    expect(secondSync.state.credits).toBe(200);

    // Run weekly event and send aid to an affected classmate planet
    state = runWeeklyUniverseEvent(state, cosmos.planets.map((p) => p.id), { seed: 99 });
    const classmateHit = state.weeklyBulletin.find((e) => e.planetId !== 'thalassa')?.planetId;
    expect(classmateHit).toBeTruthy();

    const beforeHab = getPlanetRecord(state, classmateHit).habitability;
    const aided = sendPlanetaryAid(state, classmateHit);
    expect(aided.ok).toBe(true);
    expect(aided.state.credits).toBe(210);
    expect(getPlanetRecord(aided.state, classmateHit).habitability).toBe(beforeHab + 10);

    // Cannot aid the same planet twice in the same week
    const dupAid = sendPlanetaryAid(aided.state, classmateHit);
    expect(dupAid.ok).toBe(false);
    expect(dupAid.reason).toBe('already-aided');
  });

  it('persists Spaceship Builder versions in playground state via saveSpaceshipProject', async () => {
    const { saveSpaceshipProject } = await import('../src/features/universe/playground/playgroundModel.js');
    let state = initialPlaygroundState('thalassa');
    expect(state.savedShips).toEqual([]);

    state = saveSpaceshipProject(state, { name: 'Thalassa Probe I', version: 1, simulation: { passed: true } });
    state = saveSpaceshipProject(state, { name: 'Thalassa Probe II', version: 2, simulation: { passed: false } });
    expect(state.savedShips).toHaveLength(2);
    expect(state.savedShips[0].name).toBe('Thalassa Probe II');
    expect(state.savedShips[1].name).toBe('Thalassa Probe I');
  });

  it('computes a single prioritized Next Mission via getNextMission', async () => {
    const { getNextMission, saveSpaceshipProject } = await import('../src/features/universe/playground/playgroundModel.js');
    const thalassa = cosmos.planetById('thalassa');
    let state = initialPlaygroundState('thalassa');

    // Step 1: scan
    expect(getNextMission(state, thalassa).id).toBe('first-scan');
    state = investigatePlanet(state, thalassa).state;

    // Step 2: cultivate producer
    expect(getNextMission(state, thalassa).id).toBe('cultivate-producer');
    state = cultivateLife(state, 'thalassa', 'biolume-kelp').state;

    // Step 3: first build
    expect(getNextMission(state, thalassa).id).toBe('first-build');
    state = buildFeature(state, 'thalassa', 'solar-float-array').state;

    // Step 4: spaceship lab
    expect(getNextMission(state, thalassa).id).toBe('first-ship');
    state = saveSpaceshipProject(state, { name: 'Thalassa Explorer I', version: 1 });

    // Step 5: weekly cycle
    expect(getNextMission(state, thalassa).id).toBe('weekly-cycle');
  });
});
