import { z } from 'zod';

export const PblMilestoneSchema = z.object({
  id: z.string(),
  stageNumber: z.number().int().min(1).max(8),
  stageName: z.string(), // e.g. "Curiosity", "Empathise", "Define", "Ideate", "Prototype", "Test", "Reflect", "Showcase"
  title: z.string(),
  week: z.number().int().min(1).max(12),
  durationMin: z.number().int().default(90),
  learningGoal: z.string(),
  activities: z.array(z.string()),
  makerSpaceTools: z.array(z.string()),
  evidencePrompt: z.string(),
  allowedSubmissions: z.array(z.enum(['video', 'github', 'prototype', 'note', 'photo', 'data'])).default(['video', 'github', 'prototype']),
  coachCue: z.string() // Specific intervention cue for Coach Donovan or Coach Sara
});

export const MakerSpaceSpecSchema = z.object({
  toolType: z.string(), // e.g. "3D Printer", "Microcontroller", "Laser Cutter", "Sensors"
  specs: z.string(), // e.g. "Bambu Lab X1-Carbon, 0.4mm nozzle, PETG, 20% gyroid infill"
  safetyGuidelines: z.string()
});

export const CoachCuesSchema = z.object({
  leadCoach: z.string().default('Coach Donovan'),
  initiationCue: z.string(),
  frustrationDeescalationCue: z.string(),
  midCheckCue: z.string(),
  showcaseCue: z.string()
});

export const PblUnitSchema = z.object({
  id: z.string(),
  unitTitle: z.string(),
  theme: z.string(),
  drivingQuestion: z.string(),
  realProblem: z.object({
    summary: z.string(),
    peopleImpact: z.string(),
    environmentalImpact: z.string()
  }),
  targetLearner: z.object({
    id: z.string(),
    name: z.string(),
    diagnosisTraits: z.union([z.string(), z.array(z.string())]).transform((v) => (Array.isArray(v) ? v.join(', ') : v || '')),
    consumingPassions: z.union([z.string(), z.array(z.string())]).transform((v) => (Array.isArray(v) ? v.join(', ') : v || '')),
    executiveFunctionHurdles: z.union([z.string(), z.array(z.string())]).transform((v) => (Array.isArray(v) ? v.join(', ') : v || '')),
    appliedAccommodations: z.array(z.string()).default([])
  }),
  makerSpaceSpecs: z.array(MakerSpaceSpecSchema),
  coachCues: CoachCuesSchema,
  milestones: z.array(PblMilestoneSchema).length(8),
  status: z.enum(['draft', 'published', 'in_progress']).default('draft'),
  publishedAt: z.number().nullable().default(null)
});
