/**
 * Knowledge Grounding Vault Sources (NotebookLM style)
 * Reference documents for standards, MakerSpace specifications, and curriculum guides.
 */

export const DEFAULT_GROUNDING_SOURCES = [
  {
    id: 'src-cambridge-stem',
    title: 'Cambridge Lower Secondary STEM Framework',
    category: 'Curriculum Standards',
    icon: 'BookOpen',
    tokenCount: 6840,
    active: true,
    summary: 'Inquiry-led engineering cycle, scientific measurement rigor, hypotheses validation, and technical documentation.',
    excerpt: `Cambridge Lower Secondary Science Curriculum (0893):
- Stage 8 Thinking and Working Scientifically (TWSc): Design multi-variable investigations, control experimental variables, calibrate digital sensors.
- Design & Technology Competencies: Formulate iterative prototypes, evaluate tolerances, document failure modes.`
  },
  {
    id: 'src-ngss-engineering',
    title: 'NGSS Middle School Engineering Design (MS-ETS1)',
    category: 'Standards',
    icon: 'Award',
    tokenCount: 5210,
    active: true,
    summary: 'Criteria and constraints definition (MS-ETS1-1), systematic design evaluation (MS-ETS1-2), iterative testing & optimization (MS-ETS1-4).',
    excerpt: `Next Generation Science Standards - Engineering Design:
- MS-ETS1-1: Define the criteria and constraints of a design problem with sufficient precision.
- MS-ETS1-2: Evaluate competing design solutions using a systematic process to determine how well they meet criteria.
- MS-ETS1-3: Analyze data from tests to determine similarities and differences among several design solutions.
- MS-ETS1-4: Develop a model to generate data for iterative testing and modification of a proposed object, tool, or process.`
  },
  {
    id: 'src-makerspace-lab',
    title: 'WeLearn MakerSpace Hardware & Fab Lab Spec Sheet',
    category: 'MakerSpace Specs',
    icon: 'Wrench',
    tokenCount: 4620,
    active: true,
    summary: 'Bambu Lab X1-Carbon 3D printers (PETG/PLA/TPU, 0.4mm nozzle), Epilog Zing 24 Laser (3mm/6mm acrylic, birch), micro:bit V2 & Raspberry Pi Pico pinouts, 5V pumps, soldering benches.',
    excerpt: `WeLearn MakerSpace Fabrication Protocol:
- 3D Printing: 3x Bambu Lab X1-Carbon with AMS. Maximum build volume 256x256x256mm. Recommended settings for robotics: PETG, 0.20mm layer height, 4 walls, 25% gyroid infill for structural impact resistance.
- Laser Cutting: Epilog Zing 24 (40W CO2). Tolerances ±0.15mm kerf. Approved materials: 3mm Cast Acrylic, 3mm/4mm Baltic Birch Plywood. Prohibited: PVC/Vinyl.
- Electronics & Microcontrollers: BBC micro:bit V2 (nRF52833 with built-in MEMS mic, touch logo, 5x5 LED matrix, I2C/SPI), Raspberry Pi Pico W (dual-core Cortex-M0+, MicroPython), 5V DC low-voltage submersible micro-pumps, Grove capacitive soil moisture sensors.`
  },
  {
    id: 'src-un-sdgs',
    title: 'UN Sustainable Development Goals (SDG 9 & 11)',
    category: 'Real-World Impact',
    icon: 'Leaf',
    tokenCount: 3950,
    active: true,
    summary: 'Industry, Innovation & Infrastructure (SDG 9), Sustainable Cities & Resilient Communities (SDG 11). Real-world problem framing.',
    excerpt: `UN SDGs Framework:
- SDG 9: Build resilient infrastructure, promote inclusive and sustainable industrialization, and foster innovation.
- SDG 11: Make cities and human settlements inclusive, safe, resilient, and sustainable.
- Impact Requirement: All student projects must verify measurable impact for people (health, accessibility, comfort) or environment (resource efficiency, waste reduction, ecological monitoring).`
  }
];

export function calculateTotalTokens(sources) {
  return sources.filter((s) => s.active).reduce((sum, s) => sum + s.tokenCount, 0);
}
