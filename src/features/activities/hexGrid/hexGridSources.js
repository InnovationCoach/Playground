/**
 * Every outside number the Hex-Grid simulation uses, and where it came from.
 *
 * Three kinds of number appear in this activity and the UI always says which:
 *   DATA        - a published figure, with its source below. Checked by web
 *                 search on 2026-09-25 unless `checked` says otherwise.
 *   ESTIMATE    - a round engineering / farming figure the model needs but for
 *                 which no single source was verified. Learners are invited to
 *                 replace these with their own research.
 *   ASSUMPTION  - a choice the learner makes (their design, or a theoretical
 *                 idea such as a genetic modification). Never presented as fact.
 *
 * Do not add a DATA figure without a source a teacher could open.
 */

export const SOURCES = {
  nation2026: {
    label: 'The Nation Thailand (30 May 2026) - "Bangkok warned of major flood risk by early 2030s"',
    url: 'https://www.nationthailand.com/thailand/bangkok/40066834'
  },
  thElectricity: {
    label: 'Thailand electricity use ≈ 3,000 kWh per person per year (2023: reported 2,977-3,032) - Statista / World Bank',
    url: 'https://data.worldbank.org/indicator/EG.USE.ELEC.KH.PC?locations=TH'
  },
  thSolar: {
    label: 'Thailand average solar irradiation 1,875 kWh/m²/yr (≈ 5.06 kWh/m²/day) - RatedPower; check any site on the World Bank Global Solar Atlas',
    url: 'https://ratedpower.com/blog/solar-energy-thailand/'
  },
  swro: {
    label: 'Seawater reverse-osmosis desalination uses roughly 2.8-4.5 kWh per m³ (theoretical minimum ≈ 1 kWh/m³) - review, Applied Energy 2019',
    url: 'https://www.sciencedirect.com/science/article/abs/pii/S030626191931339X'
  },
  barbosa2015: {
    label: 'Lages Barbosa et al. 2015, IJERPH 12(6):6879 - hydroponic lettuce 41 kg/m²/yr, 20 L/kg water, 90,000 kJ/kg energy (Arizona)',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4483736/'
  },
  who2020: {
    label: 'WHO 2020 physical activity guidelines - adults 150-300 min/week moderate; ages 5-17 an average of 60 min/day',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7719906/'
  },
  protein2007: {
    label: 'WHO/FAO/UNU 2007 - safe protein intake 0.83 g per kg body mass per day (adults)',
    url: 'https://www.fao.org/4/aa040e/aa040e09.htm'
  },
  water: {
    label: 'UN / OHCHR human right to water - 50 to 100 litres per person per day',
    url: 'https://sr-watersanitation.ohchr.org/en/rightstowater_5.html'
  },
  dga: {
    label: 'US Dietary Guidelines 2015-2020, Appendix 2 Table A2-1 (from IOM 2002) - calorie needs by age, sex and activity',
    url: 'https://www.apa.org/obesity-guideline/estimated-calorie-needs.pdf'
  },
  fcrBroiler: {
    label: 'Broiler chicken feed conversion ≈ 1.5 kg feed per kg gain (2018)',
    url: 'https://en.wikipedia.org/wiki/Broiler_industry'
  },
  fcrFish: {
    label: 'Fry et al. 2018, Environ. Res. Lett. - fed aquaculture and chicken convert feed similarly; tilapia FCR ≈ 1.6-1.8',
    url: 'https://iopscience.iop.org/article/10.1088/1748-9326/aaa273'
  },
  biogas: {
    label: 'EESI fact sheet - 100-200 m³ biogas per tonne of food waste; biogas is 50-70% methane',
    url: 'https://www.eesi.org/papers/view/fact-sheet-biogasconverting-waste-to-energy'
  },
  thWaste: {
    label: 'Thailand municipal waste ≈ 1.15 kg per person per day (2024); about 50% biodegradable',
    url: 'https://en.wikipedia.org/wiki/Waste_management_in_Thailand'
  },
  riceTh: {
    label: 'Thailand rice ≈ 3.0 t paddy per harvested hectare (FAOSTAT, via Our World in Data)',
    url: 'https://ourworldindata.org/grapher/rice-yields'
  },
  sweetPotato: {
    label: 'World sweet potato ≈ 12.35 t/ha (2023, FAOSTAT as reported)',
    url: 'https://data.un.org/Data.aspx?d=FAO&f=itemCode:122'
  },
  soy: {
    label: 'World soybean ≈ 2.6-2.9 t/ha in recent years - USDA FAS',
    url: 'https://www.fas.usda.gov/data/production/2222000'
  },
  rainBkk: {
    label: 'Bangkok rainfall ≈ 1,650 mm/yr (reported range ≈ 1,500-1,760 mm)',
    url: 'https://www.tmd.go.th/en/ClimateChart/annual-mean-rainfall-in-thailand-mm'
  },
  unHabitat: {
    label: 'UN-Habitat (SDG 11.1.1) - overcrowded when more than 3 people share a habitable room',
    url: 'https://unhabitat.org/sites/default/files/2020/06/indicator_11.1.1_training_module_adequate_housing_and_slum_upgrading.pdf'
  },
  usda: {
    label: 'USDA FoodData Central (SR Legacy), raw foods, rounded - NOT re-checked in this build; spot-check before relying on it',
    url: 'https://fdc.nal.usda.gov/',
    checked: false
  },
  euAnimals: {
    label: 'EU Directive 2007/43/EC (broilers max 33 kg/m²) and 1999/74/EC (barn hens max 9 per m²) - NOT re-checked in this build',
    url: 'https://eur-lex.europa.eu/eli/dir/2007/43/oj',
    checked: false
  },
  physics: {
    label: 'Standard physical values: seawater ≈ 1,025 kg/m³, fresh water 1,000 kg/m³, concrete ≈ 2,400, steel ≈ 7,850, HDPE plastic ≈ 950 kg/m³, methane ≈ 9.97 kWh/m³',
    url: 'https://en.wikipedia.org/wiki/Seawater'
  }
};

/**
 * The flood facts shown on the mission screen, from the Nation article only.
 * Quoted as that article reports them, attributed, not re-derived.
 */
export const BANGKOK_FACTS = [
  { value: '0-2 m', text: 'Bangkok\'s height above sea level' },
  { value: '1.3-2.3 cm', text: 'sea level rise per year reported for the area' },
  { value: '2030-2034', text: 'period experts flag as highest flood risk (2031 especially)' },
  { value: '1.44 trillion ฿', text: 'economic damage from the 2011 floods' },
  { value: '~30 yrs → ~1 yr', text: 'major flooding shifting from a 30-year cycle towards almost every year' }
];
