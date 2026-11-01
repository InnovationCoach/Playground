# WeLearn SPARK — Shared Data Contract (Backend & Frontend)

> **Shared contract between Gemini 3.8 (Backend/Data) and Opus 5.5 (UX/UI).**
> Neither agent modifies this schema without updating this document and flagging the change in writing.

## Collections & Documents

### `users/{uid}`
```ts
{
  uid: string,
  displayName: string,
  email: string,
  role: 'learner' | 'coach' | 'admin' | 'parent' | 'supervisor',
  classIds: string[],
  cohort?: 'primary' | 'lower-secondary' | 'higher-secondary', // primary (6-11), lower-secondary (12-14), higher-secondary (15-18)
  ageBand?: string, // legacy compatibility alias
  createdAt: number,
  isTest?: boolean
}
```

### `classes/{classId}`
```ts
{
  id?: string,
  name: string,
  coachIds: string[],
  learnerIds: string[],
  programId?: string,
  joinCode?: string,
  joinCodeActive: boolean,
  createdAt: number,
  updatedAt?: any
}
```

### `frameworks/welearn-dt`
Single source of truth — 8 phases (Approved by Mani).
```ts
{
  version: 1,
  phases: [
    { id: 'explore',   label: 'Explore',              weeks: [1, 3] },
    { id: 'empathise', label: 'Empathise',            weeks: [3, 4] },
    { id: 'define',    label: 'Define',               weeks: [4, 5] },
    { id: 'ideate',    label: 'Ideate and plan',      weeks: [5, 6] },
    { id: 'prototype', label: 'Prototype',            weeks: [6, 9] },
    { id: 'test',      label: 'Test and improve',     weeks: [9, 11] },
    { id: 'showcase',  label: 'Showcase or present',  weeks: [11, 12] },
    { id: 'reflect',   label: 'Reflect and iterate',  weeks: [12, 12] }
  ]
}
```
*Note: Confirmed with Mani (24 Oct 2026): "Reflect" is officially a standalone 8th phase in the WeLearn Design Thinking framework, sharing week 12 with Showcase (`[11, 12]`).*
*Note: No consent gate (decided 2026-10-26). WeLearn keeps physical consent and staff enrol learners. No consent field is part of the data contract.*

### `pbl_programs/{programId}`
```ts
{
  id?: string,
  title: string,
  slug: string,
  drivingQuestion: string,
  theme: string,
  impact: {
    people: string,
    environment: string
  },
  frameworkId: 'welearn-dt',
  frameworkVersion: 1,
  phases: Array<{
    phaseId: string,
    title: string,
    learningGoal: string,
    sessions: Array<{
      title: string,
      minutes: number,
      activities: string[]
    }>,
    tools: string[],        // ALWAYS array, never undefined
    deliverables: string[], // ALWAYS array, never undefined
    coachCue?: string
  }>,
  cohort: 'primary' | 'lower-secondary' | 'higher-secondary' | string,
  ageBand?: string,       // legacy compatibility alias
  durationWeeks: 12,
  authorId: string,
  source: 'studio' | 'library',
  status: 'draft' | 'published' | 'archived',
  visibility: 'class' | 'centre', // 'centre' = searchable by all learners
  searchTokens: string[],         // lower-case words from title/theme/tags
  tags: string[],
  createdAt: number,
  updatedAt: number,
  publishedAt?: number
}
```

### `enrolments/{learnerUid}_{programId}`
```ts
{
  learnerId: string,
  programId: string,
  classId?: string,
  source: 'coach-assigned' | 'self-added',
  currentPhaseId: string,
  status: 'active' | 'completed' | 'dropped',
  startedAt: number,
  updatedAt: number
}
```

### `enrolments/{id}/phaseProgress/{phaseId}`
```ts
{
  status: 'not_started' | 'in_progress' | 'submitted' | 'reviewed',
  evidence: Array<{
    type: 'video' | 'link' | 'file' | 'text' | 'makerspace',
    url?: string,
    note?: string,
    at: number
  }>,
  coachFeedback?: {
    text: string,
    rating?: number,
    coachId: string,
    at: number
  },
  updatedAt: number
}
```

### `sessions/{sessionId}`
Time tracking heartbeats.
```ts
{
  uid: string,
  startedAt: number,
  lastHeartbeatAt: number,
  endedAt?: number
}
```
