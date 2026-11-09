import React, { useState, useMemo } from 'react';
import {
  X,
  Heart,
  MapPin,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Award,
  BookOpen,
  Mic,
  QrCode,
  Coins
} from 'lucide-react';
import {
  STREETPAWS_CORE_FEATURES,
  STREETPAWS_MTC_COMPETENCIES,
  STREETPAWS_DAILY_ESL_ROUTINE,
  STREETPAWS_12_WEEK_CURRICULUM,
  STREETPAWS_PITCH_SLIDES,
  STREETPAWS_ESL_PITCH_SCRIPT,
  STREETPAWS_ASSESSMENT_RUBRIC,
  STREETPAWS_GAMIFICATION_BADGES,
  simulateStreetPawsApp
} from '../pbl';

interface StreetPawsSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveToPortfolio?: (title: string, summary: string) => void;
}

export const StreetPawsSimulator: React.FC<StreetPawsSimulatorProps> = ({
  isOpen,
  onClose,
  onSaveToPortfolio
}) => {
  const [activeTab, setActiveTab] = useState<'app_budget' | 'curriculum' | 'pitch_script' | 'mtc_rubric'>('app_budget');

  // Tab 1: 4 App Pillars & Week 6 THB Sustainability Simulator State
  const [neighborhoodAnimalsCount, setNeighborhoodAnimalsCount] = useState<number>(10);
  const [dogFoodBag15KgPriceTHB, setDogFoodBag15KgPriceTHB] = useState<number>(600);
  const [partnerPetShopDiscountPct, setPartnerPetShopDiscountPct] = useState<number>(10);
  const [vetCheckAndVaccineCostTHB, setVetCheckAndVaccineCostTHB] = useState<number>(500);
  const [animalsNeedingVaccinePerMonth, setAnimalsNeedingVaccinePerMonth] = useState<number>(2);
  const [sosSurgeryGoalTHB, setSosSurgeryGoalTHB] = useState<number>(2000);
  const [sosRaisedSoFarTHB, setSosRaisedSoFarTHB] = useState<number>(1200);
  const [microDonationBowlTHB, setMicroDonationBowlTHB] = useState<number>(15);
  const [monthlyMicroDonationCount, setMonthlyMicroDonationCount] = useState<number>(260);
  const [monthlyPartnerSponsorTHB, setMonthlyPartnerSponsorTHB] = useState<number>(2500);
  const [clicksToReportSos, setClicksToReportSos] = useState<number>(3);
  const [feedingMapTotalPins, setFeedingMapTotalPins] = useState<number>(6);
  const [feedingMapGreenVerifiedPins, setFeedingMapGreenVerifiedPins] = useState<number>(5);
  const [qrStationWeatherproofAndWorking, setQrStationWeatherproofAndWorking] = useState<boolean>(true);
  const [usabilityTestersCount, setUsabilityTestersCount] = useState<number>(5);
  const [beforeAfterImprovementsCount, setBeforeAfterImprovementsCount] = useState<number>(3);
  const [animalFilter, setAnimalFilter] = useState<'all' | 'dog' | 'cat'>('all');

  // Tab 2: 12-Week Curriculum & ESL Problem Statement Builder
  const [selectedWeekNum, setSelectedWeekNum] = useState<number>(1);
  const [personaUserName, setPersonaUserName] = useState<string>('Auntie Mali (Age 45)');
  const [personaAction, setPersonaAction] = useState<string>('coordinate feeding 10 cats near the BTS station every Tuesday');
  const [personaReason, setPersonaReason] = useState<string>('when she gets sick, nobody feeds the cats because other volunteers do not know her schedule');
  const [personaSolution, setPersonaSolution] = useState<string>('provide a Live Volunteer Feeding Map with Red and Green photo-verified pins in 3 clicks or less');

  // Tab 3: Fill-in-the-Blank ESL Pitch Script State
  const [teamName, setTeamName] = useState<string>('Soi Paws Heroes');
  const [appName, setAppName] = useState<string>('StreetPaws');
  const [neighborhoodName, setNeighborhoodName] = useState<string>('Sukhumvit Soi 50');
  const [exampleAnimalName, setExampleAnimalName] = useState<string>('Somchai');
  const [problem1, setProblem1] = useState<string>('hunger and dirty water');
  const [problem2, setProblem2] = useState<string>('sickness and traffic');
  const [problem3, setProblem3] = useState<string>('no safe forever home');
  const [interviewedCount, setInterviewedCount] = useState<string>('15');
  const [wantToHelpPct, setWantToHelpPct] = useState<string>('87');
  const [partnerShopName, setPartnerShopName] = useState<string>('Happy Tails Pet Supply');
  const [pinLocationName, setPinLocationName] = useState<string>('Soi 4 Park');
  const [vetClinicName, setVetClinicName] = useState<string>('Sukhumvit Community Vet Clinic');
  const [testedUsersCount, setTestedUsersCount] = useState<string>('5');
  const [userFeedbackItem, setUserFeedbackItem] = useState<string>('they did not know if the food donation was for dogs or cats');
  const [designImprovement, setDesignImprovement] = useState<string>('adding big Dog and Cat icon filter buttons at the top of the donation page');
  const [completedSlides, setCompletedSlides] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
    4: true,
    5: true,
    6: true,
    7: false,
    8: false
  });

  // Tab 4: MTC Rubric & Gamification Badges
  const [rubricTiers, setRubricTiers] = useState<Record<number, 'emerging' | 'developing' | 'proficient' | 'mastery'>>({
    1: 'proficient',
    2: 'proficient',
    3: 'proficient',
    4: 'proficient',
    5: 'proficient',
    6: 'proficient'
  });
  const [claimedBadges, setClaimedBadges] = useState<Record<string, boolean>>({
    'streetpaws-hazard-scout': true,
    'streetpaws-empathy-listener': true,
    'streetpaws-three-click-architect': true
  });

  const sim = useMemo(
    () =>
      simulateStreetPawsApp({
        neighborhoodAnimalsCount,
        dogFoodBag15KgPriceTHB,
        partnerPetShopDiscountPct,
        vetCheckAndVaccineCostTHB,
        animalsNeedingVaccinePerMonth,
        sosSurgeryGoalTHB,
        microDonationBowlTHB,
        monthlyMicroDonationCount,
        monthlyPartnerSponsorTHB,
        clicksToReportSos,
        feedingMapTotalPins,
        feedingMapGreenVerifiedPins,
        qrStationWeatherproofAndWorking,
        usabilityTestersCount,
        beforeAfterImprovementsCount
      }),
    [
      neighborhoodAnimalsCount,
      dogFoodBag15KgPriceTHB,
      partnerPetShopDiscountPct,
      vetCheckAndVaccineCostTHB,
      animalsNeedingVaccinePerMonth,
      sosSurgeryGoalTHB,
      microDonationBowlTHB,
      monthlyMicroDonationCount,
      monthlyPartnerSponsorTHB,
      clicksToReportSos,
      feedingMapTotalPins,
      feedingMapGreenVerifiedPins,
      qrStationWeatherproofAndWorking,
      usabilityTestersCount,
      beforeAfterImprovementsCount
    ]
  );

  if (!isOpen) return null;

  const selectedWeek =
    STREETPAWS_12_WEEK_CURRICULUM.find((w) => w.week === selectedWeekNum) ||
    STREETPAWS_12_WEEK_CURRICULUM[0];

  const totalXp = STREETPAWS_GAMIFICATION_BADGES.reduce(
    (acc, b) => acc + (claimedBadges[b.id] ? b.xp : 0),
    0
  );

  const sosProgressPct = Math.min(100, Math.round((sosRaisedSoFarTHB / Math.max(1, sosSurgeryGoalTHB)) * 100));

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Top Modal Header */}
        <div className="bg-teal-900 text-white px-5 py-4 flex items-center justify-between gap-4 border-b border-teal-800">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-teal-200 mb-0.5">
              <span className="font-mono uppercase tracking-wider bg-teal-800/90 px-2 py-0.5 rounded border border-teal-600">
                12 Weeks • 2 Hrs/Day (Mon–Fri) • 120 Hours Total
              </span>
              <span>·</span>
              <span>Design Thinking (Empathize, Define, Ideate, Prototype, Test &amp; Pitch)</span>
              <span>·</span>
              <span className="bg-amber-400/20 text-amber-200 px-2 py-0.5 rounded border border-amber-400/40 font-semibold">
                {totalXp} Rescue XP
              </span>
            </div>
            <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <Heart className="w-5 h-5 text-amber-300" />
              StreetPaws — The Community Animal Rescue App Studio
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-teal-200 hover:text-white p-1.5 rounded-lg hover:bg-teal-800 transition-colors"
            aria-label="Close StreetPaws Simulator"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-stone-100 px-5 py-2 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveTab('app_budget')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'app_budget'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white text-stone-700 hover:bg-stone-200/70 border border-stone-200'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              1. 4 App Pillars &amp; THB Budget Lab
            </button>
            <button
              onClick={() => setActiveTab('curriculum')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'curriculum'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white text-stone-700 hover:bg-stone-200/70 border border-stone-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              2. 12-Week ESL Curriculum &amp; Personas
            </button>
            <button
              onClick={() => setActiveTab('pitch_script')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'pitch_script'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white text-stone-700 hover:bg-stone-200/70 border border-stone-200'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              3. 8-Slide Deck &amp; 4-Speaker ESL Script
            </button>
            <button
              onClick={() => setActiveTab('mtc_rubric')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'mtc_rubric'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white text-stone-700 hover:bg-stone-200/70 border border-stone-200'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              4. 6 MTC Competencies, Rubric &amp; Badges
            </button>
          </div>

          <div className="text-[11px] font-medium text-stone-600">
            Status:{' '}
            {sim.showcaseReady ? (
              <span className="text-emerald-700 font-bold">Showcase &amp; Shelter Drive Ready ✓</span>
            ) : (
              <span className="text-amber-700 font-bold">Needs Iteration Before Week 12</span>
            )}
          </div>
        </div>

        {/* Main Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-stone-50/60">
          {activeTab === 'app_budget' && (
            <div className="space-y-6">
              {/* Daily 2-Hour ESL Class Routine Banner */}
              <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-teal-900">
                    Daily 2-Hour ESL Class Routine (Monday – Friday)
                  </h3>
                  <span className="text-[11px] text-stone-500 italic">
                    Predictable, low-stress structure for ESL learners
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {STREETPAWS_DAILY_ESL_ROUTINE.map((slot) => (
                    <div
                      key={slot.timeRange}
                      className="bg-teal-50/60 border border-teal-200/80 rounded-lg p-2.5 text-xs"
                    >
                      <div className="font-mono font-bold text-teal-900">
                        {slot.timeRange} ({slot.duration})
                      </div>
                      <div className="font-semibold text-stone-900 mt-0.5">{slot.title}</div>
                      <p className="text-[11px] text-stone-600 mt-1 leading-snug">{slot.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4 Core App Features Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {STREETPAWS_CORE_FEATURES.map((feat) => (
                  <div
                    key={feat.id}
                    className="bg-white rounded-xl border border-stone-200 p-3.5 shadow-2xs flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        Pillar {feat.number}
                      </span>
                      <h4 className="text-sm font-bold text-stone-900 mt-1.5">{feat.title}</h4>
                      <p className="text-xs text-stone-600 mt-1">{feat.description}</p>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-stone-100 text-[11px] text-stone-500">
                      {feat.sampleUxDetail}
                    </div>
                  </div>
                ))}
              </div>

              {/* Interactive Simulator Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left Column: Controls */}
                <div className="lg:col-span-7 bg-white rounded-xl border border-stone-200 p-4 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-stone-900">
                        Week 6 &amp; Weeks 7–10: Real-World THB Budget &amp; UX Simulator
                      </h3>
                      <p className="text-xs text-stone-500">
                        15kg Dog Food Bag = 600 THB (feeds 10 dogs for 5 days = 12 THB/dog/day) • Vet Check + Vaccine = 500 THB
                      </p>
                    </div>
                    <span className="text-xs font-mono bg-stone-100 px-2 py-1 rounded text-stone-700">
                      {sim.costPerAnimalPerDayTHB} THB / animal / day
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="font-semibold text-stone-700 flex justify-between">
                        <span>Neighbourhood Animals Fed:</span>
                        <span className="font-mono text-teal-700">{neighborhoodAnimalsCount} animals</span>
                      </label>
                      <input
                        type="range"
                        min={5}
                        max={40}
                        value={neighborhoodAnimalsCount}
                        onChange={(e) => setNeighborhoodAnimalsCount(Number(e.target.value))}
                        className="w-full mt-1 accent-teal-700"
                      />
                      <span className="text-[11px] text-stone-500">
                        Needs {sim.bagsNeededPerMonth} × 15kg bags/month ({sim.grossMonthlyFoodTHB} THB gross)
                      </span>
                    </div>

                    <div>
                      <label className="font-semibold text-stone-700 flex justify-between">
                        <span>15kg Food Bag Price (THB):</span>
                        <span className="font-mono text-teal-700">{dogFoodBag15KgPriceTHB} THB</span>
                      </label>
                      <input
                        type="range"
                        min={400}
                        max={1000}
                        step={25}
                        value={dogFoodBag15KgPriceTHB}
                        onChange={(e) => setDogFoodBag15KgPriceTHB(Number(e.target.value))}
                        className="w-full mt-1 accent-teal-700"
                      />
                      <span className="text-[11px] text-stone-500">
                        PDF Benchmark: 600 THB per 15kg bag
                      </span>
                    </div>

                    <div>
                      <label className="font-semibold text-stone-700 flex justify-between">
                        <span>Partner Pet Store Discount (%):</span>
                        <span className="font-mono text-teal-700">{partnerPetShopDiscountPct}%</span>
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={25}
                        value={partnerPetShopDiscountPct}
                        onChange={(e) => setPartnerPetShopDiscountPct(Number(e.target.value))}
                        className="w-full mt-1 accent-teal-700"
                      />
                      <span className="text-[11px] text-stone-500">
                        U-SEC Week 6: Local pet stores give 10% discount on donated food
                      </span>
                    </div>

                    <div>
                      <label className="font-semibold text-stone-700 flex justify-between">
                        <span>Vaccines / Month (@ {vetCheckAndVaccineCostTHB} THB):</span>
                        <span className="font-mono text-teal-700">{animalsNeedingVaccinePerMonth} animals</span>
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={10}
                        value={animalsNeedingVaccinePerMonth}
                        onChange={(e) => setAnimalsNeedingVaccinePerMonth(Number(e.target.value))}
                        className="w-full mt-1 accent-teal-700"
                      />
                      <span className="text-[11px] text-stone-500">
                        Basic Vet Check + Vaccine = 500 THB
                      </span>
                    </div>

                    <div>
                      <label className="font-semibold text-stone-700 flex justify-between">
                        <span>"1 Bowl of Food" Button Price:</span>
                        <span className="font-mono text-teal-700">{microDonationBowlTHB} THB</span>
                      </label>
                      <input
                        type="range"
                        min={10}
                        max={50}
                        step={5}
                        value={microDonationBowlTHB}
                        onChange={(e) => setMicroDonationBowlTHB(Number(e.target.value))}
                        className="w-full mt-1 accent-teal-700"
                      />
                      <span className="text-[11px] text-stone-500">
                        PDF Example: "Buy 1 Bowl of Food for 15 THB"
                      </span>
                    </div>

                    <div>
                      <label className="font-semibold text-stone-700 flex justify-between">
                        <span>Monthly 15-THB Bowl Donations:</span>
                        <span className="font-mono text-teal-700">{monthlyMicroDonationCount} bowls</span>
                      </label>
                      <input
                        type="range"
                        min={50}
                        max={600}
                        step={10}
                        value={monthlyMicroDonationCount}
                        onChange={(e) => setMonthlyMicroDonationCount(Number(e.target.value))}
                        className="w-full mt-1 accent-teal-700"
                      />
                      <span className="text-[11px] text-stone-500">
                        Raises {sim.monthlyMicroDonationIncomeTHB} THB/month from student pocket money
                      </span>
                    </div>

                    <div>
                      <label className="font-semibold text-stone-700 flex justify-between">
                        <span>Monthly Shop / School Sponsor:</span>
                        <span className="font-mono text-teal-700">{monthlyPartnerSponsorTHB} THB</span>
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={6000}
                        step={250}
                        value={monthlyPartnerSponsorTHB}
                        onChange={(e) => setMonthlyPartnerSponsorTHB(Number(e.target.value))}
                        className="w-full mt-1 accent-teal-700"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-stone-700 flex justify-between">
                        <span>Clicks to Report Medical SOS:</span>
                        <span
                          className={`font-mono font-bold ${
                            sim.threeClickRulePassed ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          {clicksToReportSos} clicks {sim.threeClickRulePassed ? '(<=3 OK)' : '(Too many!)'}
                        </span>
                      </label>
                      <input
                        type="range"
                        min={1}
                        max={7}
                        value={clicksToReportSos}
                        onChange={(e) => setClicksToReportSos(Number(e.target.value))}
                        className="w-full mt-1 accent-teal-700"
                      />
                      <span className="text-[11px] text-stone-500">
                        Week 3 &amp; Speaker 3 Rule: Photo + GPS + Problem in 3 clicks or less
                      </span>
                    </div>

                    <div>
                      <label className="font-semibold text-stone-700 flex justify-between">
                        <span>Week 10 Usability Testers &amp; Fixes:</span>
                        <span className="font-mono text-teal-700">
                          {usabilityTestersCount} users / {beforeAfterImprovementsCount} fixes
                        </span>
                      </label>
                      <div className="flex gap-2 mt-1">
                        <input
                          type="number"
                          min={0}
                          max={20}
                          value={usabilityTestersCount}
                          onChange={(e) => setUsabilityTestersCount(Number(e.target.value))}
                          className="w-1/2 border border-stone-300 rounded px-2 py-1 text-xs"
                          aria-label="Outside usability testers count"
                        />
                        <input
                          type="number"
                          min={0}
                          max={15}
                          value={beforeAfterImprovementsCount}
                          onChange={(e) => setBeforeAfterImprovementsCount(Number(e.target.value))}
                          className="w-1/2 border border-stone-300 rounded px-2 py-1 text-xs"
                          aria-label="Before and after improvements count"
                        />
                      </div>
                      <span className="text-[11px] text-stone-500">
                        Target: &gt;= 5 outside users &amp; &gt;= 3 Version 2.0 "Before &amp; After" improvements
                      </span>
                    </div>

                    <div className="flex flex-col justify-center">
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={qrStationWeatherproofAndWorking}
                          onChange={(e) => setQrStationWeatherproofAndWorking(e.target.checked)}
                          className="rounded text-teal-700 focus:ring-teal-600"
                        />
                        <span className="font-semibold text-stone-800">
                          Week 9 Physical QR Feeding Station Working
                        </span>
                      </label>
                      <span className="text-[11px] text-stone-500 mt-1">
                        Rain-proof PVC pipe feeder / Donation Bin with QR sticker
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Interactive Mobile App Preview & THB Ledger */}
                <div className="lg:col-span-5 space-y-4">
                  {/* Simulated Mobile Screen Preview */}
                  <div className="bg-stone-900 text-white rounded-2xl p-4 border-4 border-stone-800 shadow-lg space-y-3">
                    <div className="flex items-center justify-between border-b border-stone-700 pb-2">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-teal-300 font-mono">
                          Version 2.0 Interactive Preview
                        </span>
                        <h4 className="text-sm font-bold">🐾 {appName}: Tap to Feed, Tap to Save</h4>
                      </div>
                      <span className="text-[11px] bg-teal-800 text-teal-200 px-2 py-0.5 rounded font-mono">
                        {clicksToReportSos}-Click UX
                      </span>
                    </div>

                    {/* Week 10 Before & After Animal Filter */}
                    <div className="flex items-center justify-between bg-stone-800/90 rounded-lg p-2 text-xs">
                      <span className="text-stone-300 font-medium">Week 10 V2.0 Filter:</span>
                      <div className="flex gap-1">
                        {(['all', 'dog', 'cat'] as const).map((f) => (
                          <button
                            key={f}
                            onClick={() => setAnimalFilter(f)}
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              animalFilter === f
                                ? 'bg-amber-400 text-stone-950'
                                : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                            }`}
                          >
                            {f === 'all' ? 'All' : f === 'dog' ? '🐶 Dog' : '🐱 Cat'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Feature 2: Live Volunteer Feeding Map */}
                    <div className="bg-stone-800 rounded-xl p-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-teal-300 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          Live Volunteer Feeding Map ({sim.feedingCoveragePct}% Fed Today)
                        </span>
                        <button
                          onClick={() =>
                            setFeedingMapGreenVerifiedPins((prev) =>
                              prev < feedingMapTotalPins ? prev + 1 : 2
                            )
                          }
                          className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold"
                        >
                          Upload Bowl Photo (+1 Green Pin)
                        </button>
                      </div>
                      <div className="text-[11px] space-y-1 text-stone-300">
                        <div className="flex items-center justify-between bg-stone-900/80 px-2.5 py-1.5 rounded">
                          <span>📍 Pin A ({pinLocationName}): 4 Cats</span>
                          <span
                            className={`font-semibold ${
                              sim.feedingMapRedPins === 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {sim.feedingMapRedPins === 0
                              ? 'Green Pin — Fed Today! ✓'
                              : `Red Pin — Hungry (${sim.feedingMapRedPins} left)`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between bg-stone-900/80 px-2.5 py-1.5 rounded">
                          <span>📍 Pin B (Temple Gate): 3 Dogs</span>
                          <span className="text-emerald-400 font-semibold">
                            Green Pin — Fed by Coach Donovan at 7:30 AM
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Feature 3: Medical SOS & Vet Bill Progress Bar */}
                    <div className="bg-stone-800 rounded-xl p-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-rose-300 flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          SOS Vet Crowdfunding (Lucky&apos;s Leg Surgery)
                        </span>
                        <button
                          onClick={() =>
                            setSosRaisedSoFarTHB((prev) => Math.min(sosSurgeryGoalTHB, prev + microDonationBowlTHB))
                          }
                          className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded text-[11px] font-bold"
                        >
                          +{microDonationBowlTHB} THB Bowl
                        </button>
                      </div>
                      <div className="w-full bg-stone-900 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full transition-all"
                          style={{ width: `${sosProgressPct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-stone-300 font-mono">
                        <span>
                          Raised {sosRaisedSoFarTHB.toLocaleString()} / {sosSurgeryGoalTHB.toLocaleString()} THB
                        </span>
                        <span>{sosProgressPct}% Funded</span>
                      </div>
                    </div>

                    {/* Feature 4: Somchai Adoption Card */}
                    <div className="bg-stone-800 rounded-xl p-2.5 text-[11px] flex items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-amber-300">
                          🐕 {exampleAnimalName} (2 yrs, Male) — Vaccinated ✅ | Sterilized ✅
                        </div>
                        <div className="text-stone-300">
                          Gentle, quiet, loves belly rubs • Rescued outside 7-Eleven on {neighborhoodName}
                        </div>
                      </div>
                      <span className="shrink-0 bg-teal-600 px-2.5 py-1 rounded font-bold text-white">
                        Meet {exampleAnimalName}
                      </span>
                    </div>
                  </div>

                  {/* Week 6 Monthly THB Income & Expense Summary */}
                  <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs space-y-2.5 text-xs">
                    <h4 className="font-bold text-stone-900 uppercase tracking-wider text-[11px]">
                      Week 6 Monthly Thai Baht (THB) Impact Ledger
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-stone-50 p-2.5 rounded border border-stone-200">
                        <div className="text-stone-500">Monthly Food (Net {partnerPetShopDiscountPct}% Off)</div>
                        <div className="text-sm font-bold font-mono text-stone-900">
                          {sim.netMonthlyFoodTHB.toLocaleString()} THB
                        </div>
                      </div>
                      <div className="bg-stone-50 p-2.5 rounded border border-stone-200">
                        <div className="text-stone-500">Monthly Vet + SOS Care</div>
                        <div className="text-sm font-bold font-mono text-stone-900">
                          {sim.monthlyVetAndVaccineTHB.toLocaleString()} THB
                        </div>
                      </div>
                      <div className="bg-teal-50 p-2.5 rounded border border-teal-200">
                        <div className="text-teal-800">Total Monthly Income</div>
                        <div className="text-sm font-bold font-mono text-teal-900">
                          {sim.totalMonthlyIncomeTHB.toLocaleString()} THB
                        </div>
                      </div>
                      <div
                        className={`p-2.5 rounded border ${
                          sim.financiallySustainable
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            : 'bg-rose-50 border-rose-200 text-rose-900'
                        }`}
                      >
                        <div>Monthly Net Balance</div>
                        <div className="text-sm font-bold font-mono">
                          {sim.monthlySurplusOrDeficitTHB >= 0 ? '+' : ''}
                          {sim.monthlySurplusOrDeficitTHB.toLocaleString()} THB
                        </div>
                      </div>
                    </div>

                    {onSaveToPortfolio && (
                      <button
                        onClick={() =>
                          onSaveToPortfolio(
                            `StreetPaws THB Impact Budget & 4-Pillar Prototype (${neighborhoodAnimalsCount} Animals)`,
                            `Feeding ${neighborhoodAnimalsCount} neighbourhood animals costs ${sim.netMonthlyFoodTHB} THB/month (${sim.costPerAnimalPerDayTHB} THB/animal/day after ${partnerPetShopDiscountPct}% partner pet shop discount) + ${sim.monthlyVetAndVaccineTHB} THB vet/SOS care = ${sim.totalMonthlyExpenseTHB} THB total expense. Community income from ${monthlyMicroDonationCount} × ${microDonationBowlTHB} THB bowls (${sim.monthlyMicroDonationIncomeTHB} THB) + ${monthlyPartnerSponsorTHB} THB sponsor = ${sim.totalMonthlyIncomeTHB} THB (Net: ${sim.monthlySurplusOrDeficitTHB} THB). 3-Click SOS Rule: ${clicksToReportSos} clicks. Feeding Map: ${sim.feedingMapGreenPins}/${feedingMapTotalPins} green pins. Usability tested with ${usabilityTestersCount} users and ${beforeAfterImprovementsCount} Version 2.0 fixes.`
                          )
                        }
                        className="w-full mt-2 py-2 px-3 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Save THB Impact Budget &amp; App Metrics to Portfolio
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'curriculum' && (
            <div className="space-y-5">
              {/* Week Selector Pills */}
              <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs">
                <div className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2.5">
                  Part 2: 12-Week Curriculum &amp; Weekly Breakdown (Click a Week)
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-12 gap-1.5">
                  {STREETPAWS_12_WEEK_CURRICULUM.map((w) => (
                    <button
                      key={w.week}
                      onClick={() => setSelectedWeekNum(w.week)}
                      className={`px-2 py-2 rounded-lg text-xs font-bold transition-colors border ${
                        selectedWeekNum === w.week
                          ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      Wk {w.week}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Week Detail Card */}
              <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200">
                      {selectedWeek.curriculumPhase} • DonPBL Phase: {selectedWeek.mappedDesignPhase.toUpperCase()}
                    </span>
                    <h3 className="text-base font-bold text-stone-900 mt-1.5">{selectedWeek.title}</h3>
                  </div>
                  <div className="text-xs font-medium text-stone-600 bg-stone-100 px-3 py-1 rounded-lg">
                    Target Competency: <span className="font-bold text-stone-900">{selectedWeek.targetCompetency}</span>
                  </div>
                </div>

                <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-3 text-xs">
                  <span className="font-bold text-amber-900">Weekly Driving Question: </span>
                  <span className="text-stone-800 italic">{selectedWeek.drivingQuestion}</span>
                </div>

                {/* ESL Vocabulary Word Wall */}
                <div>
                  <div className="text-xs font-bold text-stone-700 mb-1.5">
                    Daily Stand-Up &amp; Word Wall ESL Vocabulary:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedWeek.eslVocabulary.map((word) => (
                      <span
                        key={word}
                        className="px-2.5 py-1 bg-teal-50 text-teal-900 border border-teal-200 rounded-md text-xs font-semibold"
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 10-Hour Weekly Schedule Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="bg-stone-50 rounded-lg p-3 border border-stone-200">
                    <div className="font-bold text-stone-900 mb-1">Mon–Tue (4 Hours)</div>
                    <p className="text-stone-600 leading-relaxed">{selectedWeek.monTueActivity}</p>
                  </div>
                  <div className="bg-stone-50 rounded-lg p-3 border border-stone-200">
                    <div className="font-bold text-stone-900 mb-1">Wed–Thu (4 Hours)</div>
                    <p className="text-stone-600 leading-relaxed">{selectedWeek.wedThuActivity}</p>
                  </div>
                  <div className="bg-emerald-50/70 rounded-lg p-3 border border-emerald-200">
                    <div className="font-bold text-emerald-900 mb-1">Fri Weekly Checkpoint (2 Hours)</div>
                    <p className="text-emerald-950 leading-relaxed">{selectedWeek.friCheckpoint}</p>
                  </div>
                </div>

                {/* Concrete Examples */}
                <div className="bg-stone-900 text-stone-100 rounded-lg p-3.5 text-xs space-y-1.5">
                  <div className="font-bold text-amber-300 uppercase tracking-wider text-[11px]">
                    Concrete Classroom Examples from Curriculum Guide:
                  </div>
                  {selectedWeek.concreteExamples.map((ex, i) => (
                    <p key={i} className="font-mono text-[11px] leading-relaxed text-stone-200">
                      • {ex}
                    </p>
                  ))}
                </div>

                {/* L-SEC vs U-SEC Differentiation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3">
                    <div className="font-bold text-blue-950 mb-1">
                      L-SEC (Lower Secondary) Differentiation:
                    </div>
                    <p className="text-blue-900 leading-relaxed">{selectedWeek.lSecDifferentiation}</p>
                  </div>
                  <div className="bg-purple-50/70 border border-purple-200 rounded-lg p-3">
                    <div className="font-bold text-purple-950 mb-1">
                      U-SEC (Upper Secondary) Differentiation:
                    </div>
                    <p className="text-purple-900 leading-relaxed">{selectedWeek.uSecDifferentiation}</p>
                  </div>
                </div>
              </div>

              {/* Week 3 Interactive ESL Problem Statement Builder */}
              <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs space-y-3">
                <h4 className="text-sm font-bold text-stone-900">
                  Week 3 Interactive ESL Problem Statement Frame Builder
                </h4>
                <p className="text-xs text-stone-500">
                  ESL Frame: <code className="font-mono bg-stone-100 px-1.5 py-0.5 rounded">&quot;[User Name] needs a way to [Action] because [Reason], so our app will [Solution].&quot;</code>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-semibold text-stone-700">[User Name] (Persona):</label>
                    <input
                      type="text"
                      value={personaUserName}
                      onChange={(e) => setPersonaUserName(e.target.value)}
                      className="w-full mt-1 border border-stone-300 rounded-lg px-2.5 py-1.5"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-stone-700">[Action] (What they need to do):</label>
                    <input
                      type="text"
                      value={personaAction}
                      onChange={(e) => setPersonaAction(e.target.value)}
                      className="w-full mt-1 border border-stone-300 rounded-lg px-2.5 py-1.5"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-stone-700">[Reason] (Barrier / Frustration):</label>
                    <input
                      type="text"
                      value={personaReason}
                      onChange={(e) => setPersonaReason(e.target.value)}
                      className="w-full mt-1 border border-stone-300 rounded-lg px-2.5 py-1.5"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-stone-700">[Solution] (3-Click App Feature):</label>
                    <input
                      type="text"
                      value={personaSolution}
                      onChange={(e) => setPersonaSolution(e.target.value)}
                      className="w-full mt-1 border border-stone-300 rounded-lg px-2.5 py-1.5"
                    />
                  </div>
                </div>
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 text-xs text-teal-950 font-medium">
                  &ldquo;<strong>{personaUserName}</strong> needs a way to <strong>{personaAction}</strong> because{' '}
                  <strong>{personaReason}</strong>, so our app will <strong>{personaSolution}</strong>.&rdquo;
                </div>
                {onSaveToPortfolio && (
                  <button
                    onClick={() =>
                      onSaveToPortfolio(
                        `StreetPaws Persona & ESL Problem Statement (${personaUserName})`,
                        `"${personaUserName} needs a way to ${personaAction} because ${personaReason}, so our app will ${personaSolution}."`
                      )
                    }
                    className="py-2 px-4 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    Save ESL Problem Statement to Portfolio
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'pitch_script' && (
            <div className="space-y-6">
              {/* 8-Slide Pitch Deck Structure */}
              <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">
                      Part 3: Final Week 10-Minute Showcase — 8-Slide Pitch Deck Structure
                    </h3>
                    <p className="text-xs text-stone-500">
                      Check off each slide as your team completes the visuals and cue cards in Week 11
                    </p>
                  </div>
                  <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded border border-teal-200">
                    {Object.values(completedSlides).filter(Boolean).length} / 8 Slides Ready
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {STREETPAWS_PITCH_SLIDES.map((s) => {
                    const done = !!completedSlides[s.slideNumber];
                    return (
                      <button
                        key={s.slideNumber}
                        onClick={() =>
                          setCompletedSlides((prev) => ({
                            ...prev,
                            [s.slideNumber]: !prev[s.slideNumber]
                          }))
                        }
                        className={`text-left p-3 rounded-lg border text-xs transition-colors ${
                          done
                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                            : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span>{s.title}</span>
                          {done && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                        </div>
                        <p className="text-[11px] mt-1 text-stone-600 leading-snug">{s.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fill-in-the-Blank ESL Pitch Script Builder */}
              <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-stone-900">
                    Fill-in-the-Blank ESL Pitch Script Builder (For 4 Team Members — 10 Minutes Total)
                  </h3>
                  <p className="text-xs text-stone-500">
                    Customize the bracketed fields below to generate your team&apos;s rehearsal cue cards
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="font-semibold text-stone-700">[Team Name]:</label>
                    <input
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      className="w-full mt-1 border border-stone-300 rounded px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-stone-700">[App Name]:</label>
                    <input
                      type="text"
                      value={appName}
                      onChange={(e) => setAppName(e.target.value)}
                      className="w-full mt-1 border border-stone-300 rounded px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-stone-700">[Neighborhood Name]:</label>
                    <input
                      type="text"
                      value={neighborhoodName}
                      onChange={(e) => setNeighborhoodName(e.target.value)}
                      className="w-full mt-1 border border-stone-300 rounded px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-stone-700">[Example Dog/Cat Name]:</label>
                    <input
                      type="text"
                      value={exampleAnimalName}
                      onChange={(e) => setExampleAnimalName(e.target.value)}
                      className="w-full mt-1 border border-stone-300 rounded px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-stone-700">[Partner Shop Name]:</label>
                    <input
                      type="text"
                      value={partnerShopName}
                      onChange={(e) => setPartnerShopName(e.target.value)}
                      className="w-full mt-1 border border-stone-300 rounded px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-stone-700">[Pin Location]:</label>
                    <input
                      type="text"
                      value={pinLocationName}
                      onChange={(e) => setPinLocationName(e.target.value)}
                      className="w-full mt-1 border border-stone-300 rounded px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-stone-700">[Local Rescue / Vet Clinic]:</label>
                    <input
                      type="text"
                      value={vetClinicName}
                      onChange={(e) => setVetClinicName(e.target.value)}
                      className="w-full mt-1 border border-stone-300 rounded px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-stone-700">[Week 10 Improvement]:</label>
                    <input
                      type="text"
                      value={designImprovement}
                      onChange={(e) => setDesignImprovement(e.target.value)}
                      className="w-full mt-1 border border-stone-300 rounded px-2 py-1"
                    />
                  </div>
                </div>

                {/* Generated 4-Speaker Script Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-200 space-y-1.5">
                    <div className="font-bold text-teal-900">
                      Speaker 1: The Hook &amp; The Problem (2 Minutes)
                    </div>
                    <p className="text-stone-700 leading-relaxed">
                      &ldquo;Good morning/afternoon everyone! We are Team <strong>{teamName}</strong>, and today we are proud to introduce <strong>{appName}</strong>. Every day on our way to school in <strong>{neighborhoodName}</strong>, we see street dogs and cats like <strong>{exampleAnimalName}</strong>. They face three big problems: <strong>{problem1}</strong>, <strong>{problem2}</strong>, and <strong>{problem3}</strong>. In Week 2, we interviewed <strong>{interviewedCount}</strong> people in our community. <strong>{wantToHelpPct}%</strong> said they want to help street animals, but they don&apos;t know where to donate food, who is already feeding the animals, or how to pay for a vet. That is why we built <strong>{appName}</strong>.&rdquo;
                    </p>
                  </div>

                  <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-200 space-y-1.5">
                    <div className="font-bold text-teal-900">
                      Speaker 2: Live App Demo — Food Donation &amp; Volunteer Feeding Map (2.5 Minutes)
                    </div>
                    <p className="text-stone-700 leading-relaxed">
                      &ldquo;Let me show you how <strong>{appName}</strong> works! When you open our home screen, you see four simple buttons. First is our <strong>Food Donation Hub</strong>. If you don&apos;t have time to volunteer, you can tap here to donate just <strong>{microDonationBowlTHB} Baht</strong> for one bowl of food, or drop off a bag of food at our partner shop, <strong>{partnerShopName}</strong>. Second is our <strong>Live Volunteer Feeding Map</strong>. Look at the pins on our map. A <strong>Red Pin</strong> means the animals at <strong>{pinLocationName}</strong> are hungry today. When a volunteer feeds them and takes a photo, the pin turns <strong>Green</strong>! This stops food waste and makes sure no animal is forgotten.&rdquo;
                    </p>
                  </div>

                  <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-200 space-y-1.5">
                    <div className="font-bold text-teal-900">
                      Speaker 3: Live App Demo — Medical SOS &amp; Adoption Matchmaker (2.5 Minutes)
                    </div>
                    <p className="text-stone-700 leading-relaxed">
                      &ldquo;What happens if you see a hurt or sick animal? You tap our third feature: <strong>Medical SOS</strong>. In just three clicks, you take a photo, share your GPS location, and choose the problem. Our app sends an alert to <strong>{vetClinicName}</strong> and opens a transparent Vet Bill tracker so the community can help pay for the medicine together. Once an animal is healthy, they move to our fourth feature: <strong>Adoption Matchmaker</strong>. Here you can meet friendly animals like <strong>{exampleAnimalName}</strong>, read their story, check their vaccine status, and apply to give them a forever home.&rdquo;
                    </p>
                  </div>

                  <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-200 space-y-1.5">
                    <div className="font-bold text-teal-900">
                      Speaker 4: Physical QR Station, Testing &amp; Call to Action (3 Minutes)
                    </div>
                    <p className="text-stone-700 leading-relaxed">
                      &ldquo;To connect our app to the real streets, we also built this <strong>Community QR Feeding Station</strong> (point to physical prototype). Anyone walking by can scan this QR code to check the animals or donate food in 10 seconds. In Week 10, we tested our app with <strong>{testedUsersCount}</strong> users. They told us <strong>{userFeedbackItem}</strong>, so we improved our design by <strong>{designImprovement}</strong>. Please take out your phones right now and scan the QR code on the screen to try <strong>{appName}</strong> for yourselves! Together, we can feed, heal, and adopt our street animals. Thank you! We are ready for your questions.&rdquo;
                    </p>
                  </div>
                </div>

                {onSaveToPortfolio && (
                  <button
                    onClick={() =>
                      onSaveToPortfolio(
                        `StreetPaws 10-Minute 4-Speaker ESL Pitch Script (${teamName})`,
                        `Team ${teamName} (${appName} in ${neighborhoodName}): 8-Slide Deck (${Object.values(completedSlides).filter(Boolean).length}/8 ready). Speaker 1 Hook (${exampleAnimalName}, ${wantToHelpPct}% of ${interviewedCount} surveyed want to help), Speaker 2 (${microDonationBowlTHB} THB bowl & ${partnerShopName} + Red/Green Pin Map at ${pinLocationName}), Speaker 3 (3-Click SOS to ${vetClinicName} + ${exampleAnimalName} Adoption), Speaker 4 (Physical QR Feeding Station + Week 10 fix: ${designImprovement}).`
                      )
                    }
                    className="py-2 px-4 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    Save 4-Speaker ESL Pitch Script to Portfolio
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'mtc_rubric' && (
            <div className="space-y-6">
              {/* Part 1: The 6 Selected WeLearn MTC Competencies */}
              <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs space-y-3">
                <h3 className="text-sm font-bold text-stone-900">
                  Part 1: The 6 Selected WeLearn MTC Competencies (Foundational Credits)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-stone-100 text-stone-700 border-b border-stone-200">
                        <th className="p-2.5 font-bold">#</th>
                        <th className="p-2.5 font-bold">WeLearn Future Skill</th>
                        <th className="p-2.5 font-bold">L-SEC Competency Code &amp; Name</th>
                        <th className="p-2.5 font-bold">U-SEC Competency Code &amp; Name</th>
                        <th className="p-2.5 font-bold">Simplified ESL &ldquo;I Can&rdquo; Goal</th>
                        <th className="p-2.5 font-bold">Portfolio Artifact / Evidence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {STREETPAWS_MTC_COMPETENCIES.map((c) => (
                        <tr key={c.number} className="hover:bg-stone-50/80">
                          <td className="p-2.5 font-mono font-bold text-teal-800">{c.number}</td>
                          <td className="p-2.5 font-bold text-stone-900">{c.weLearnFutureSkill}</td>
                          <td className="p-2.5 text-stone-700">{c.lSecCodeAndName}</td>
                          <td className="p-2.5 text-stone-700">{c.uSecCodeAndName}</td>
                          <td className="p-2.5 italic text-teal-900 font-medium">{c.eslICanGoal}</td>
                          <td className="p-2.5 font-semibold text-stone-800">{c.portfolioArtifact}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Part 4: Interactive 4-Tier WeLearn MTC Competency Assessment Rubric */}
              <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs space-y-3">
                <h3 className="text-sm font-bold text-stone-900">
                  Part 4: WeLearn MTC Competency Assessment Rubric (Click a Proficiency Tier to Self-Assess)
                </h3>
                <div className="space-y-3">
                  {STREETPAWS_ASSESSMENT_RUBRIC.map((row) => {
                    const selected = rubricTiers[row.number] || 'proficient';
                    return (
                      <div key={row.number} className="border border-stone-200 rounded-xl p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-stone-900">
                            {row.competency} <span className="font-mono text-teal-700">({row.codes})</span>
                          </span>
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                            Selected: {selected}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                          {(
                            [
                              { key: 'emerging', label: 'Emerging', text: row.emerging },
                              { key: 'developing', label: 'Developing', text: row.developing },
                              {
                                key: 'proficient',
                                label: 'Proficient (Target Credit)',
                                text: row.proficientTargetCredit
                              },
                              { key: 'mastery', label: 'Mastery', text: row.mastery }
                            ] as const
                          ).map((tier) => (
                            <button
                              key={tier.key}
                              onClick={() =>
                                setRubricTiers((prev) => ({
                                  ...prev,
                                  [row.number]: tier.key
                                }))
                              }
                              className={`text-left p-2.5 rounded-lg border transition-colors ${
                                selected === tier.key
                                  ? 'bg-teal-50 border-teal-600 text-teal-950 ring-1 ring-teal-600'
                                  : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                              }`}
                            >
                              <div className="font-bold text-[11px] mb-1">{tier.label}</div>
                              <p className="text-[11px] leading-snug">{tier.text}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 7 Gamification Badges */}
              <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-stone-900">
                    StreetPaws Rescue Studio Badges ({totalXp} XP Earned)
                  </h3>
                  <span className="text-xs text-stone-500">Click any badge as your team unlocks it</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {STREETPAWS_GAMIFICATION_BADGES.map((badge) => {
                    const unlocked = !!claimedBadges[badge.id];
                    return (
                      <button
                        key={badge.id}
                        onClick={() =>
                          setClaimedBadges((prev) => ({
                            ...prev,
                            [badge.id]: !prev[badge.id]
                          }))
                        }
                        className={`text-left p-3 rounded-xl border text-xs transition-all ${
                          unlocked
                            ? 'bg-amber-50/80 border-amber-400 text-stone-900 shadow-2xs'
                            : 'bg-stone-50 border-stone-200 text-stone-500 hover:bg-stone-100'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span>{badge.title}</span>
                          <span className="font-mono text-[11px] text-amber-800">+{badge.xp} XP</span>
                        </div>
                        <p className="text-[11px] mt-1 leading-snug">{badge.criteria}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
