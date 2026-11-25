/**
 * Deterministic Spaceship Physics & Engineering Simulation Engine (Part 7.5).
 * Kept strictly separate from AI mentor text: only real computed telemetry is returned.
 */

export const SPACESHIP_PARTS = {
  hull: [
    { id: 'lightweight-alloy', name: 'Lightweight Aluminum-Lithium Hull', massKg: 1200, maxPassengers: 4, integrity: 70 },
    { id: 'composite-frame', name: 'Carbon-Composite Frame', massKg: 950, maxPassengers: 3, integrity: 65 },
    { id: 'titanium-hull', name: 'Reinforced Titanium Hull', massKg: 2100, maxPassengers: 8, integrity: 95 }
  ],
  propulsion: [
    { id: 'ion-thruster', name: 'Xenon Ion Thruster', massKg: 420, thrustKn: 28, powerDrawKw: 35, isp: 3200 },
    { id: 'chemical-booster', name: 'Bi-Propellant Chemical Booster', massKg: 780, thrustKn: 68, powerDrawKw: 10, isp: 450 },
    { id: 'plasma-drive', name: 'Magnetoplasma Drive', massKg: 650, thrustKn: 52, powerDrawKw: 55, isp: 2400 }
  ],
  power: [
    { id: 'solar-array', name: 'Deployable Solar Wings', massKg: 260, powerOutputKw: 32 },
    { id: 'rtg-core', name: 'Radioisotope Thermal Generator', massKg: 380, powerOutputKw: 48 },
    { id: 'fusion-microcell', name: 'Compact Fusion Microcell', massKg: 540, powerOutputKw: 85 }
  ],
  shield: [
    { id: 'thermal-shield', name: 'Ceramic Thermal Tiles', massKg: 240, shieldRating: 65, lifeSupportCap: 4 },
    { id: 'radiation-canopy', name: 'Active Magnetic Radiation Canopy', massKg: 360, shieldRating: 90, lifeSupportCap: 6 },
    { id: 'oxygen-scrubber', name: 'Closed-Loop Life Support Pod', massKg: 310, shieldRating: 70, lifeSupportCap: 8 }
  ]
};

export const MENTOR_QUESTIONS = [
  'What is your spaceship’s mission purpose (cargo, crew transport, or deep-space survey)?',
  'How many passengers does it need to carry safely?',
  'Does your power core generate enough kilowatts for both propulsion and life support?',
  'How will the hull and shielding protect passengers from radiation and thermal stress?'
];

/**
 * Runs a deterministic engineering & physics check on the learner's spaceship design.
 */
export function simulateSpaceshipDesign({
  name = 'Unnamed Craft',
  purpose = 'Orbital survey',
  passengers = 2,
  parts = {}
} = {}) {
  const hull = SPACESHIP_PARTS.hull.find((p) => p.id === parts.hull) || SPACESHIP_PARTS.hull[0];
  const propulsion = SPACESHIP_PARTS.propulsion.find((p) => p.id === parts.propulsion) || SPACESHIP_PARTS.propulsion[0];
  const power = SPACESHIP_PARTS.power.find((p) => p.id === parts.power) || SPACESHIP_PARTS.power[0];
  const shield = SPACESHIP_PARTS.shield.find((p) => p.id === parts.shield) || SPACESHIP_PARTS.shield[0];

  const passengerCount = Math.max(1, Math.min(12, Number(passengers) || 1));
  const passengerMassKg = passengerCount * 110;
  const totalMassKg = hull.massKg + propulsion.massKg + power.massKg + shield.massKg + passengerMassKg;

  // Weight in kN under standard 9.81 m/s^2 reference gravity
  const weightKn = (totalMassKg * 9.81) / 1000;
  const thrustToWeightRatio = Number((propulsion.thrustKn / weightKn).toFixed(2));

  const lifeSupportDrawKw = passengerCount * 4;
  const totalDrawKw = propulsion.powerDrawKw + lifeSupportDrawKw;
  const powerBalanceKw = power.powerOutputKw - totalDrawKw;

  // Tsiolkovsky-inspired delta-v estimate (fuel fraction 0.35)
  const deltaVKms = Number((((propulsion.isp * 9.81) / 1000) * Math.log(1 / 0.65)).toFixed(2));
  const maxSafePassengers = Math.min(hull.maxPassengers, shield.lifeSupportCap);

  const diagnostics = [];
  if (thrustToWeightRatio < 1.05) {
    diagnostics.push(`Thrust-to-weight ratio (${thrustToWeightRatio}) is below 1.05 — reduce mass or choose higher thrust.`);
  }
  if (powerBalanceKw < 0) {
    diagnostics.push(`Power deficit (${powerBalanceKw} kW) — upgrade your power core or reduce propulsion draw.`);
  }
  if (passengerCount > maxSafePassengers) {
    diagnostics.push(`Passenger count (${passengerCount}) exceeds hull/life-support capacity (${maxSafePassengers}).`);
  }
  if (shield.shieldRating < 60) {
    diagnostics.push('Shield rating is below minimum 60 for interplanetary transit.');
  }

  return {
    craftName: String(name).trim() || 'Unnamed Craft',
    purpose: String(purpose).trim() || 'Orbital survey',
    passengers: passengerCount,
    parts: { hull: hull.id, propulsion: propulsion.id, power: power.id, shield: shield.id },
    metrics: {
      totalMassKg,
      thrustToWeightRatio,
      powerOutputKw: power.powerOutputKw,
      powerDrawKw: totalDrawKw,
      powerBalanceKw,
      deltaVKms,
      shieldRating: shield.shieldRating,
      maxSafePassengers
    },
    passed: diagnostics.length === 0,
    diagnostics,
    simulatedAt: new Date().toISOString()
  };
}

/**
 * Socratic AI Engineering Mentor hint based on current design (never auto-completes).
 */
export function mentorHintForDesign(simResult) {
  if (!simResult) return MENTOR_QUESTIONS[0];
  if (simResult.metrics.powerBalanceKw < 0) {
    return `Your craft has a ${simResult.metrics.powerBalanceKw} kW power deficit. Compare your propulsion draw (${simResult.metrics.powerDrawKw} kW) against your power core output — which upgrade balances the budget?`;
  }
  if (simResult.metrics.thrustToWeightRatio < 1.05) {
    return `With a total mass of ${simResult.metrics.totalMassKg} kg, your thrust-to-weight ratio is ${simResult.metrics.thrustToWeightRatio}. How could you either lighten the hull or increase thrust?`;
  }
  if (simResult.passengers > simResult.metrics.maxSafePassengers) {
    return `Your hull/life-support supports ${simResult.metrics.maxSafePassengers} passengers, but you scheduled ${simResult.passengers}. What trade-off makes this crew safe?`;
  }
  return `Your ${simResult.craftName} passed simulation (TWR ${simResult.metrics.thrustToWeightRatio}, +${simResult.metrics.powerBalanceKw} kW margin, Δv ${simResult.metrics.deltaVKms} km/s)! Explain your engineering trade-offs before submitting.`;
}

/** Thresholds the simulation passes on, shared by the meters and the checks. */
export const FLIGHT_LIMITS = { minTwr: 1.05, minShield: 60, twrScaleMax: 2.2 };

/**
 * The four pre-flight checks for a simulation result, in the order the meters show them.
 * Every value comes from `simulateSpaceshipDesign`; nothing here is invented.
 * `certified` is true only when every check passes (the same rule as `passed`).
 */
export function flightChecks(sim) {
  const m = sim?.metrics;
  if (!m) return { checks: [], passedCount: 0, certified: false };
  const checks = [
    { id: 'twr', label: 'Lift-off thrust', ok: m.thrustToWeightRatio >= FLIGHT_LIMITS.minTwr,
      detail: `TWR ${m.thrustToWeightRatio} (needs ≥ ${FLIGHT_LIMITS.minTwr})` },
    { id: 'power', label: 'Power budget', ok: m.powerBalanceKw >= 0,
      detail: `${m.powerOutputKw} kW made vs ${m.powerDrawKw} kW used` },
    { id: 'capacity', label: 'Crew capacity', ok: sim.passengers <= m.maxSafePassengers,
      detail: `${sim.passengers} aboard, ${m.maxSafePassengers} safe` },
    { id: 'shield', label: 'Shielding', ok: m.shieldRating >= FLIGHT_LIMITS.minShield,
      detail: `Rating ${m.shieldRating} (needs ≥ ${FLIGHT_LIMITS.minShield})` }
  ];
  const passedCount = checks.filter((c) => c.ok).length;
  return { checks, passedCount, certified: passedCount === checks.length };
}
