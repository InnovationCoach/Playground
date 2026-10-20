/**
 * Don's PBL Prototype Mock Fixtures
 * Location: prototypes/DonPBL/mockFixtures.ts
 * 
 * Synthetic, isolated fixtures for testing and running the PBL Program prototype
 * without connecting to live Firebase, authentication, or deployed APIs.
 * All learner names, project data, quotes, and metrics are fictional.
 */

export interface CompetencyDomain {
  id: string;
  title: string;
  description: string;
}

export interface Competency {
  id: string;
  domain: string;
  code: string;
  title: string;
  statement: string;
  level: 'foundational' | 'advanced';
}

export interface EvidenceItem {
  id: string;
  phase: 'explore' | 'empathise' | 'define' | 'ideate' | 'prototype' | 'test' | 'share';
  kind: 'note' | 'media' | 'code' | 'data' | 'feedback' | 'ai' | 'reflection';
  title: string;
  body: string;
  link?: string;
  competencies: string[];
  createdAt: number;
  ai?: {
    asked: string;
    gave: string;
    kept: string;
  };
  metrics?: {
    label: string;
    value: string;
  }[];
}

export interface StudentProject {
  id: string;
  teamName: string;
  members: string[];
  gradeLevel: string;
  termId: string;
  currentPhase: 'explore' | 'empathise' | 'define' | 'ideate' | 'prototype' | 'test' | 'share';
  progressPercent: number;
  drivingQuestion: string;
  problem: {
    hmw: string;
    who: string;
    why: string;
    criteria: string;
    constraints: string;
    impactMeasure: string;
  };
  impact: 'people' | 'environment' | 'both' | null;
  codeLanguage: 'micropython' | 'makecode' | 'python' | 'arduino' | 'lego';
  finalFormat: 'showcase' | 'presentation' | 'interactive-stand' | 'stage-pitch' | null;
  tasksDone: Record<string, number[]>; // phase -> array of completed task indices
  evidence: EvidenceItem[];
  sensorState: {
    ambientTemp: number; // in deg C
    soilMoisturePct: number; // 0 - 100%
    canopyDeployed: boolean;
    pumpActive: boolean;
    waterLevelPct: number;
  };
  programId?: string;
  classId?: string;
}

export interface CoachFeedback {
  coachName: string;
  date: string;
  note: string;
  competencyScores: Record<string, number>; // competencyId -> 1..4 score
}

export const COMPETENCY_DOMAINS: CompetencyDomain[] = [
  {
    id: 'sdl',
    title: 'Self-directed Learning',
    description: 'Self-directed learning is the ability to take full responsibility for one’s academic and personal development. This includes setting meaningful goals, strategically planning learning pathways, independently managing time and resources, continuously reflecting on progress, and adapting to feedback and setbacks.'
  },
  {
    id: 'ctps',
    title: 'Critical Thinking and Problem Solving',
    description: 'Critical Thinkers always ask "why" and are not satisfied with the answer to a question until they fully understand not only what the answer is but why it\'s the answer.'
  },
  {
    id: 'lc',
    title: 'Leadership and Collaboration',
    description: 'Learners are able to successfully work both independently and as part of a team and make informed decisions as to when to lead or follow, using influence where appropriate, with understanding and empathy.'
  },
  {
    id: 'ec',
    title: 'Effective Communication',
    description: 'Both written and oral communication allow you to tell your story and invite other people to share with you, conveying ideas clearly and with empathy.'
  },
  {
    id: 'ct',
    title: 'Creative Thinking',
    description: 'Learners can create, imagine and innovate in order to address complex problems, and aid human flourishing in the sciences, humanities and arts.'
  },
  {
    id: 'sea',
    title: 'Social and Emotional Aptitude',
    description: 'Learners can understand and manage emotions, build and maintain positive relationships, feel and show empathy for others, overcome challenges, and make responsible decisions.'
  },
  {
    id: 'ent',
    title: 'Entrepreneurship',
    description: 'Entrepreneurship is the ability to identify opportunities, develop innovative solutions, and strategically build and manage ventures that create value and adapt to dynamic markets.'
  }
];

export const CORE_COMPETENCIES: Competency[] = [
  {
    "id": "sdl-01",
    "domain": "sdl",
    "code": "1.1.1",
    "title": "Goal Setting",
    "statement": "I can set short-term learning goals with clear steps and deadlines.",
    "level": "foundational"
  },
  {
    "id": "sdl-02",
    "domain": "sdl",
    "code": "1.1.2",
    "title": "Planning and organization",
    "statement": "I can organize my learning process by breaking tasks into steps, using tools to stay on schedule, and managing resources effectively.",
    "level": "foundational"
  },
  {
    "id": "sdl-03",
    "domain": "sdl",
    "code": "1.1.3",
    "title": "Self Management",
    "statement": "I can manage my time, focus, and emotions to complete tasks independently, even when faced with distractions or challenges.",
    "level": "foundational"
  },
  {
    "id": "sdl-04",
    "domain": "sdl",
    "code": "1.1.4",
    "title": "Reflection and Self-assessment",
    "statement": "I can regularly evaluate my strengths, challenges, and learning strategies to improve my performance and outcomes.",
    "level": "foundational"
  },
  {
    "id": "sdl-05",
    "domain": "sdl",
    "code": "1.1.5",
    "title": "Learning Curiosity",
    "statement": "I show curiosity by asking questions, exploring new ideas independently, and seeking to understand unfamiliar concepts.",
    "level": "foundational"
  },
  {
    "id": "sdl-06",
    "domain": "sdl",
    "code": "1.2.1",
    "title": "Personal Goal Alignment",
    "statement": "I can create a long-term personal and academic plan aligned with my values, career interests, and purpose.",
    "level": "advanced"
  },
  {
    "id": "sdl-07",
    "domain": "sdl",
    "code": "1.2.2",
    "title": "Growth Mindset",
    "statement": "I can embrace challenges, view mistakes as opportunities to learn, and support others in doing the same.",
    "level": "advanced"
  },
  {
    "id": "sdl-08",
    "domain": "sdl",
    "code": "1.2.4",
    "title": "Academic Grit",
    "statement": "I can stay focused on long-term goals by maintaining effort and motivation even when progress is slow or tasks are difficult.",
    "level": "advanced"
  },
  {
    "id": "sdl-09",
    "domain": "sdl",
    "code": "1.2.5",
    "title": "Adaptability and resilience",
    "statement": "I can adjust my learning strategies and mindset in response to new information, challenges, or feedback to effectively achieve learning objectives.",
    "level": "advanced"
  },
  {
    "id": "sdl-10",
    "domain": "sdl",
    "code": "1.2.6",
    "title": "Responsible Decision Making",
    "statement": "I can evaluate choices related to my learning and personal development, considering the short- and long-term implications for myself and my goals.",
    "level": "advanced"
  },
  {
    "id": "sdl-11",
    "domain": "sdl",
    "code": "1.2.7",
    "title": "Interpersonal Reflection",
    "statement": "I can reflect on how my actions and communication affect others and make changes to improve relationships and collaboration.",
    "level": "advanced"
  },
  {
    "id": "sdl-12",
    "domain": "sdl",
    "code": "6.2.3",
    "title": "Perseverance",
    "statement": "I can persist in my efforts, even when facing challenges or delays in achieving success.",
    "level": "advanced"
  },
  {
    "id": "sdl-13",
    "domain": "sdl",
    "code": "6.2.4",
    "title": "Advanced Personal Reflection",
    "statement": "I can continuously reflect to establish new goals and skillfully integrate lessons learned from both successes and failures.",
    "level": "advanced"
  },
  {
    "id": "sdl-14",
    "domain": "sdl",
    "code": "6.2.2",
    "title": "Self-motivation",
    "statement": "I can embrace challenges, view mistakes as opportunities to learn, and support others in doing the same.",
    "level": "advanced"
  },
  {
    "id": "ctps-01",
    "domain": "ctps",
    "code": "2.1.1",
    "title": "Inquiry & Research Skills",
    "statement": "I can plan and conduct structured research by identifying questions, gathering and synthesizing credible sources, and forming evidence-based conclusions.",
    "level": "foundational"
  },
  {
    "id": "ctps-02",
    "domain": "ctps",
    "code": "2.1.2",
    "title": "Analysis and Evaluation",
    "statement": "I can analyze and evaluate ideas or arguments by identifying key points, assessing their relevance, comparing sources, and selecting the strongest evidence to support a conclusion.",
    "level": "foundational"
  },
  {
    "id": "ctps-03",
    "domain": "ctps",
    "code": "2.1.3",
    "title": "Data Interpretation",
    "statement": "I can extract insights from qualitative or quantitative data, explain patterns or trends through storytelling, and use those findings to support decisions or proposals.",
    "level": "foundational"
  },
  {
    "id": "ctps-04",
    "domain": "ctps",
    "code": "2.1.4",
    "title": "Meta-Cognitive Reflection",
    "statement": "I can engage in meta-cognitive reflection, critically evaluating my own thinking processes, identifying biases or assumptions, and continuously refining my approach to critical thinking.",
    "level": "foundational"
  },
  {
    "id": "ctps-05",
    "domain": "ctps",
    "code": "2.1.5",
    "title": "Computational Thinking",
    "statement": "I can use logic, patterns, and algorithmic thinking to design efficient solutions, including using spreadsheets, coding tools, or simulations to test ideas.",
    "level": "foundational"
  },
  {
    "id": "ctps-06",
    "domain": "ctps",
    "code": "2.2.2",
    "title": "Strategic Thinking",
    "statement": "I can engage in strategic thinking by establishing clear goals and priorities, and aligning all efforts with broader objectives to achieve success.",
    "level": "advanced"
  },
  {
    "id": "ctps-07",
    "domain": "ctps",
    "code": "2.2.3",
    "title": "Agile Thinking",
    "statement": "I can modify problem solving methods to new challenges, adjusting strategies to new ideas, demonstrating a shift of own thinking, and built on a body of new findings and evidence.",
    "level": "advanced"
  },
  {
    "id": "ctps-08",
    "domain": "ctps",
    "code": "2.2.4",
    "title": "Authentic Contribution",
    "statement": "I can construct, review, and publish a critical work or contribute to the published work of others in a field of study outside of the classroom.",
    "level": "advanced"
  },
  {
    "id": "ctps-09",
    "domain": "ctps",
    "code": "2.1.1",
    "title": "Problem Identification",
    "statement": "I can effectively identify and define complex problems in a clear and comprehensive manner, highlighting the essential issues that need addressing",
    "level": "foundational"
  },
  {
    "id": "ctps-10",
    "domain": "ctps",
    "code": "2.1.5",
    "title": "Synthesis of Information",
    "statement": "I can interpret and assess information from various sources, crafting a thorough synthesis or analysis of essential elements.",
    "level": "foundational"
  },
  {
    "id": "ctps-11",
    "domain": "ctps",
    "code": "2.1.6",
    "title": "Ideation",
    "statement": "I can develop creative and innovative ideas, exploring different perspectives and possibilities to tackle challenges and find sustainable solutions.",
    "level": "foundational"
  },
  {
    "id": "ctps-12",
    "domain": "ctps",
    "code": "2.1.7",
    "title": "Problem Solving Strategies",
    "statement": "I can proficiently apply a variety of effective problem-solving strategies to address obstacles and resolve challenges encountered throughout the project lifecycle.",
    "level": "foundational"
  },
  {
    "id": "lc-01",
    "domain": "lc",
    "code": "3.1.1",
    "title": "Strategic Project Execution",
    "statement": "I can lead a team to develop and execute a clear project plan that includes timelines, milestones, delegated roles, and success criteria.",
    "level": "foundational"
  },
  {
    "id": "lc-02",
    "domain": "lc",
    "code": "3.1.2",
    "title": "Collaborative Feedback Practices",
    "statement": "I can give and receive constructive feedback, reflect on my performance, and apply input to improve group outcomes.",
    "level": "foundational"
  },
  {
    "id": "lc-03",
    "domain": "lc",
    "code": "3.1.3",
    "title": "Conflict Resolution and Mediation",
    "statement": "I can contribute positively to team culture by respecting diverse perspectives, building trust, and focusing on shared goals over personal interests.",
    "level": "foundational"
  },
  {
    "id": "lc-04",
    "domain": "lc",
    "code": "3.1.4",
    "title": "Team Commitment and Responsibility",
    "statement": "I can contribute positively to team culture by respecting diverse perspectives, building trust, and focusing on shared goals over personal interests.",
    "level": "foundational"
  },
  {
    "id": "lc-05",
    "domain": "lc",
    "code": "3.1.5",
    "title": "Project Management",
    "statement": "I can create a clear plan for my group project, set achievable goals, assign tasks to team members based on their strengths, and monitor our progress.",
    "level": "foundational"
  },
  {
    "id": "lc-06",
    "domain": "lc",
    "code": "3.2.2",
    "title": "Leadership Strategies",
    "statement": "I can effectively guide my team's progress and development by using a range of leadership strategies and principles to inspire, direct, and empower team members in achieving the tasks.",
    "level": "advanced"
  },
  {
    "id": "lc-07",
    "domain": "lc",
    "code": "3.2.3",
    "title": "Strategic Visioning",
    "statement": "I can contribute to and comprehend the big picture, ensuring that my team's efforts are aligned with the overarching goals and vision of a project or organization.",
    "level": "advanced"
  },
  {
    "id": "lc-08",
    "domain": "lc",
    "code": "3.2.4",
    "title": "Emergent Leadership",
    "statement": "I can utilize my intrinsic motivation to explore and experiment with various leadership approaches and techniques, seeking guidance from experts when necessary, to effect lasting and meaningful change within the community.",
    "level": "advanced"
  },
  {
    "id": "lc-09",
    "domain": "lc",
    "code": "3.2.5",
    "title": "Ethical and Moral Integrity",
    "statement": "I can comprehend and consistently act according to ethical principles in both the school community and society at large, demonstrating integrity in my actions and decisions.",
    "level": "advanced"
  },
  {
    "id": "lc-10",
    "domain": "lc",
    "code": "3.1.3",
    "title": "Empathy in Leadership",
    "statement": "I can understand and appreciate team members' perspectives, demonstrating empathy to foster collaboration and achieve shared goals.",
    "level": "foundational"
  },
  {
    "id": "lc-11",
    "domain": "lc",
    "code": "3.1.4",
    "title": "Adaptability in Collaboration",
    "statement": "I can adjust to different roles within a team, knowing when to take the lead, support others, or facilitate cooperation to effectively accomplish the group's tasks.",
    "level": "foundational"
  },
  {
    "id": "lc-12",
    "domain": "lc",
    "code": "3.1.7",
    "title": "Motivation and Inspiration",
    "statement": "I can inspire and motivate others to reach their full potential by providing encouragement, support, and positive reinforcement.",
    "level": "foundational"
  },
  {
    "id": "ec-01",
    "domain": "ec",
    "code": "4.1.1",
    "title": "Writing Composition",
    "statement": "I can write structured and objective texts to explain ideas clearly and support them with evidence and citations.",
    "level": "foundational"
  },
  {
    "id": "ec-02",
    "domain": "ec",
    "code": "4.1.2",
    "title": "Storytelling for Impact",
    "statement": "I can share personal or fictional stories that are meaningful and memorable, using emotion, pacing, and vivid details to engage my audience.",
    "level": "foundational"
  },
  {
    "id": "ec-03",
    "domain": "ec",
    "code": "4.1.3",
    "title": "Visual Communication Design",
    "statement": "I can design slides, posters, infographics, or other visuals that enhance my message using principles of layout, contrast, typography, and alignment.",
    "level": "foundational"
  },
  {
    "id": "ec-04",
    "domain": "ec",
    "code": "4.1.4",
    "title": "Message Clarity & Precision",
    "statement": "I can express ideas with brevity and precision in both writing and speech, especially when summarizing, instructing, or responding.",
    "level": "foundational"
  },
  {
    "id": "ec-05",
    "domain": "ec",
    "code": "4.1.5",
    "title": "Empathetic Listening",
    "statement": "I can actively listen to fully understand others' perspectives, thoughts, and feelings, and demonstrate comprehension through thoughtful questions and accurate paraphrasing.",
    "level": "foundational"
  },
  {
    "id": "ec-06",
    "domain": "ec",
    "code": "4.2.1",
    "title": "Cultural Competence",
    "statement": "I can communicate respectfully and sensitively with individuals from diverse cultural backgrounds, recognizing and valuing cultural differences in communication styles and norms.",
    "level": "advanced"
  },
  {
    "id": "ec-07",
    "domain": "ec",
    "code": "4.2.2",
    "title": "Persuasion and Influence",
    "statement": "I can effectively persuade others by presenting compelling arguments and evidence, tailoring my communication to appeal to the values and interests of my audience, and utilizing persuasion ethically and responsibly to achieve desired outcomes.",
    "level": "advanced"
  },
  {
    "id": "ec-08",
    "domain": "ec",
    "code": "4.2.3",
    "title": "Advanced Public Speaking",
    "statement": "I can confidently deliver speeches in various settings and styles to diverse audiences with professionalism. Moreover, I can engage in meaningful discussions and debates, employing analytical skills, empathy, and consideration of different perspectives.",
    "level": "advanced"
  },
  {
    "id": "ec-09",
    "domain": "ec",
    "code": "4.2.4",
    "title": "Impact Through Digital Media",
    "statement": "I can create and present a mix of oral, written, and digital communications to share an original message that captures the attention of my intended audience.",
    "level": "advanced"
  },
  {
    "id": "ec-10",
    "domain": "ec",
    "code": "4.2.5",
    "title": "Advanced Topics in Written Expression",
    "statement": "I can demonstrate proficiency in both informational and creative writing through project evidence, utilizing advanced skills in communication arts.",
    "level": "advanced"
  },
  {
    "id": "ec-11",
    "domain": "ec",
    "code": "4.1.3",
    "title": "Public Speaking",
    "statement": "I can present in front of large audiences with confidence, in an engaging and convincing manner using appropriate language, tone, body language, gestures, technology and visuals, ensuring my content is engaging and comprehensible for diverse audiences.",
    "level": "foundational"
  },
  {
    "id": "ec-12",
    "domain": "ec",
    "code": "4.1.5",
    "title": "Verbal and Nonverbal Communication",
    "statement": "I can communicate effectively by expressing myself clearly and confidently using appropriate vocabulary and tone, while also utilizing body language, gestures, and facial expressions to enhance my message and convey emotions effectively in various situations.",
    "level": "foundational"
  },
  {
    "id": "ct-01",
    "domain": "ct",
    "code": "5.1.1",
    "title": "Creative Voice & Identity",
    "statement": "I can express my unique voice and personal values through creative work that is suitable for public presentation.",
    "level": "foundational"
  },
  {
    "id": "ct-02",
    "domain": "ct",
    "code": "5.1.2",
    "title": "Novel Ideation",
    "statement": "I can generate original ideas and explore unconventional approaches to challenges, developing novel concepts that offer clear improvements or new possibilities.",
    "level": "foundational"
  },
  {
    "id": "ct-03",
    "domain": "ct",
    "code": "5.1.3",
    "title": "Engineering Design",
    "statement": "I can creatively develop a structural or mechanical design that demonstrates innovative solutions, considering materials science, sustainability, and real-world feasibility.",
    "level": "foundational"
  },
  {
    "id": "ct-04",
    "domain": "ct",
    "code": "5.1.4",
    "title": "Creative Systems Innovation",
    "statement": "I can creatively conceptualize and design scalable systems or service models that address global or social challenges, informed by user research and innovative thinking.",
    "level": "foundational"
  },
  {
    "id": "ct-05",
    "domain": "ct",
    "code": "5.1.5",
    "title": "Technological Creativity",
    "statement": "I can experiment with new technologies or digital tools to test ideas, embrace ambiguity, and drive innovative outcomes.",
    "level": "foundational"
  },
  {
    "id": "ct-06",
    "domain": "ct",
    "code": "5.2.1",
    "title": "Creative Problem Solving",
    "statement": "I can employ innovative and imaginative methods to tackle challenges, devising unique solutions that push beyond traditional thinking approach.",
    "level": "advanced"
  },
  {
    "id": "ct-07",
    "domain": "ct",
    "code": "5.2.2",
    "title": "Purposeful Design",
    "statement": "I can spearhead transformative initiatives that positively influence society through my creative and innovative endeavors, pioneering novel solutions to complex challenges.",
    "level": "advanced"
  },
  {
    "id": "ct-08",
    "domain": "ct",
    "code": "5.2.3",
    "title": "Original Expression",
    "statement": "I can produce, curate, and publish or exhibit an advanced portfolio of original work that communicates a point of view based on a self-developed project.",
    "level": "advanced"
  },
  {
    "id": "ct-09",
    "domain": "ct",
    "code": "5.2.4",
    "title": "Divergent Thinking",
    "statement": "I can tackle a personally chosen transdisciplinary issue by generating and expressing original and innovative ideas to tackle a complex challenge.",
    "level": "advanced"
  },
  {
    "id": "ct-10",
    "domain": "ct",
    "code": "5.2.5",
    "title": "Applied Project Design",
    "statement": "I can utilize the design cycle to produce an innovative good or service to address a genuine societal need.",
    "level": "advanced"
  },
  {
    "id": "ct-11",
    "domain": "ct",
    "code": "5.1.4",
    "title": "Creativity from Transfer",
    "statement": "I can explore transferable learning approaches across different subjects to develop new and innovative solutions or products.",
    "level": "foundational"
  },
  {
    "id": "ct-12",
    "domain": "ct",
    "code": "5.1.7",
    "title": "Reflection and Iteration",
    "statement": "I can reflect on the creative process, receive feedback, and iteratively refine ideas or solutions to improve their quality and effectiveness.",
    "level": "foundational"
  },
  {
    "id": "sea-01",
    "domain": "sea",
    "code": "6.1.1",
    "title": "Self Awareness",
    "statement": "I can identify my strengths and areas for growth and use that understanding to set personal goals and improve how I learn and work.",
    "level": "foundational"
  },
  {
    "id": "sea-02",
    "domain": "sea",
    "code": "6.1.2",
    "title": "Interpersonal Relationships",
    "statement": "I can build strong relationships by listening, solving problems peacefully, and respecting others.",
    "level": "foundational"
  },
  {
    "id": "sea-03",
    "domain": "sea",
    "code": "6.1.3",
    "title": "Ethical Reasoning",
    "statement": "I can make responsible decisions about personal behavior and social interactions, considering morals and ethical standards and frameworks.",
    "level": "foundational"
  },
  {
    "id": "sea-04",
    "domain": "sea",
    "code": "6.1.4",
    "title": "Resilience and Perseverance",
    "statement": "I can maintain emotional strength and persist through personal setbacks or failures, viewing them as opportunities for growth and continued effort.",
    "level": "foundational"
  },
  {
    "id": "sea-05",
    "domain": "sea",
    "code": "6.1.5",
    "title": "Emotional Regulation",
    "statement": "I can recognize my emotional triggers and apply effective strategies to stay calm, balanced, and respectful during stressful moments.",
    "level": "foundational"
  },
  {
    "id": "sea-06",
    "domain": "sea",
    "code": "7.2.1",
    "title": "Stress Management",
    "statement": "I can cope with stress, setbacks, and challenges effectively, using healthy coping strategies and seeking support when needed.",
    "level": "advanced"
  },
  {
    "id": "sea-07",
    "domain": "sea",
    "code": "7.2.2",
    "title": "Assertiveness",
    "statement": "I can confidently express my needs, opinions, and boundaries while respecting those of others.",
    "level": "advanced"
  },
  {
    "id": "sea-08",
    "domain": "sea",
    "code": "7.2.4",
    "title": "Metacognition",
    "statement": "I can reflect on my own emotions and behaviors, showing willingness to learn, grow and develop from experiences and feedback.",
    "level": "advanced"
  },
  {
    "id": "sea-09",
    "domain": "sea",
    "code": "7.2.5",
    "title": "Conflict Resolution",
    "statement": "I can establish and sustain healthy and respectful relationships with a diverse range of individuals and communities, effectively managing differences and conflicts.",
    "level": "advanced"
  },
  {
    "id": "sea-10",
    "domain": "sea",
    "code": "7.1.2",
    "title": "Social Awareness",
    "statement": "I can empathize with others and understand their emotions, perspectives, and experiences. I recognize social cues, norms, and cultural differences to communicate and collaborate effectively.",
    "level": "foundational"
  },
  {
    "id": "sea-11",
    "domain": "sea",
    "code": "7.1.5",
    "title": "Postive Mindset",
    "statement": "I can maintain a positive attitude, cultivate optimism, and focus on solutions rather than dwelling on problems.",
    "level": "foundational"
  },
  {
    "id": "sea-12",
    "domain": "sea",
    "code": "7.1.6",
    "title": "Social Responsibility",
    "statement": "I can recognize my role in the community and act responsibly and ethically in my interactions with others, contributing positively to the social fabric of my community and broader society.",
    "level": "foundational"
  },
  {
    "id": "ent-01",
    "domain": "ent",
    "code": "7.1.1",
    "title": "Market Research and Analysis",
    "statement": "I can gather and analyze data about customers, competitors, and market trends to understand business opportunities.",
    "level": "foundational"
  },
  {
    "id": "ent-02",
    "domain": "ent",
    "code": "7.1.2",
    "title": "Business Planning",
    "statement": "I can create a detailed business plan that outlines goals, strategies, prepare and manage a budgets within it's financial means.",
    "level": "foundational"
  },
  {
    "id": "ent-03",
    "domain": "ent",
    "code": "7.1.3",
    "title": "Startup Financial Planning",
    "statement": "I can take intentional action to address a real-world problem, creating visible benefits for a specific group, cause, or community.",
    "level": "foundational"
  },
  {
    "id": "ent-04",
    "domain": "ent",
    "code": "7.1.4",
    "title": "Sustainable Business Modeling",
    "statement": "I can design a sustainable business model that explains how a product or service delivers value, meets customer needs, and generates income using appropriate resources.",
    "level": "foundational"
  },
  {
    "id": "ent-05",
    "domain": "ent",
    "code": "7.1.5",
    "title": "Value Proposition Development",
    "statement": "I can develop a basic startup budget that includes cost estimates, income forecasts, and breakeven analysis to assess business feasibility.",
    "level": "foundational"
  },
  {
    "id": "ent-06",
    "domain": "ent",
    "code": "1.2.1",
    "title": "Networking and Relationship Building",
    "statement": "I can develop and sustain relationships with stakeholders, mentors, and potential partners to support the growth and success of the entrepreneurial venture.",
    "level": "advanced"
  },
  {
    "id": "ent-07",
    "domain": "ent",
    "code": "1.2.3",
    "title": "Applied Social Innovation",
    "statement": "I can utilize the design cycle to produce an innovative good or service to address a genuine societal need or with a focus on global impact while producing a sustainable business plan.",
    "level": "advanced"
  },
  {
    "id": "ent-08",
    "domain": "ent",
    "code": "1.2.4",
    "title": "Advanced Apprenticeship",
    "statement": "I can work in multiple local businesses or nonprofit organizations as an intern after obtaining a mentor and doing a deep dive into resumes, cover letters, and how to land the job.",
    "level": "advanced"
  },
  {
    "id": "ent-09",
    "domain": "ent",
    "code": "1.2.5",
    "title": "Ethical and Social Responsibility",
    "statement": "I can conduct business with integrity, ensuring that entrepreneurial decisions and actions take into account ethical considerations and their broader social impact.",
    "level": "advanced"
  },
  {
    "id": "ent-10",
    "domain": "ent",
    "code": "1.1.3",
    "title": "Resilience and Adaptability",
    "statement": "I can take initiative and be proactive in seeking out opportunities, setting goals, and taking action to turn ideas into reality, without waiting for instructions or guidance.",
    "level": "foundational"
  },
  {
    "id": "ent-11",
    "domain": "ent",
    "code": "1.1.6",
    "title": "Risk Taking",
    "statement": "I can assess risks and uncertainties associated with entrepreneurial endeavors and make informed decisions about taking calculated risks to achieve goals and pursue opportunities.",
    "level": "foundational"
  }
];

export const NGSS_DIMENSIONS = {
  sep: { label: 'Science & Engineering Practice', short: 'SEP' },
  dci: { label: 'Disciplinary Core Idea', short: 'DCI' },
  ccc: { label: 'Crosscutting Concept', short: 'CCC' },
  ets: { label: 'Engineering Design', short: 'ETS' }
};

export const NGSS_RUBRIC_LEVELS = [
  { score: 1, label: 'Emerging', description: 'Requires direct guidance; major conceptual or experimental gaps.' },
  { score: 2, label: 'Developing', description: 'Applies independently with minor gaps; partial data or justification.' },
  { score: 3, label: 'Proficient', description: 'Accurate, independent execution; clear evidence and justification.' },
  { score: 4, label: 'Extending', description: 'Exemplary insight; connects to cross-cutting principles and improves methods.' }
];

export const NGSS_ALIGNMENT_ITEMS = [
  {
    peCode: 'MS-ESS3-3',
    peTitle: 'Human Impacts on Earth Systems',
    description: 'Apply scientific principles to design a method for monitoring and minimizing a human impact on the environment.',
    lookFors: {
      sep: 'Designs and executes controlled investigation measuring water evaporation and soil desiccation.',
      dci: 'Explains how urban heat retention and excessive water withdrawal stress local plant ecosystems.',
      ccc: 'Models cause-and-effect relationships between radiant solar energy, soil moisture, and plant transpiration.',
      ets: 'Evaluates competing physical canopy materials and drip delivery mechanisms using multi-trial data.'
    }
  },
  {
    peCode: 'MS-PS3-3',
    peTitle: 'Thermal Energy Transfer & Insulation',
    description: 'Apply scientific principles to design, construct, and test a device that either minimizes or maximizes thermal energy transfer.',
    lookFors: {
      sep: 'Constructs an empirical cooling curve comparing shaded vs. unshaded soil under calibrated heat radiation.',
      dci: 'Applies laws of radiation, convection, and conduction to explain Mylar reflective cooling.',
      ccc: 'Tracks energy flow through the soil-canopy system over a 60-minute solar cycle.',
      ets: 'Iterates servo-driven canopy geometry to maximize shade coverage during peak incident solar angles.'
    }
  },
  {
    peCode: 'MS-ETS1-2',
    peTitle: 'Evaluating Competing Design Solutions',
    description: 'Evaluate competing design solutions using a systematic process to determine how well they meet the criteria and constraints of the problem.',
    lookFors: {
      sep: 'Collects quantitative test metrics across 3 trials and calculates percentage water savings.',
      dci: 'Balances engineering trade-offs between mechanical servo torque, battery life, and canopy span.',
      ccc: 'Identifies system boundary interactions between electrical, mechanical, and ecological components.',
      ets: 'Redesigns fail-safe pump timeouts to prevent accidental reservoir flooding.'
    }
  }
];

// INVENTED PEOPLE NOTICE: All team names, students (Maya Chen, Leo Rossi, etc.), coaches (Coach Eleanor Vance),
// and stakeholders (Mrs. Alvarez (example persona), example persona) below are fictional synthetic fixtures.
export const SYNTHETIC_FIXTURE_NOTICE = 'All student, coach, and stakeholder names in this file are invented for offline testing.';
export const SAMPLE_STUDENT_PROJECT: StudentProject = {
  id: 'proj-ecocool-01',
  teamName: 'Team EcoCool',
  members: ['Maya Chen (Grade 8)', 'Leo Rossi (Grade 8)'],
  gradeLevel: 'Grade 8 (Age 13-14)',
  termId: 'term-2026-t3',
  currentPhase: 'share',
  progressPercent: 94,
  drivingQuestion: 'How might we use sensor-guided micro-irrigation and reflective shade canopies to protect urban community garden vegetables from extreme heat waves, reducing water waste by over 40% while keeping plants thriving?',
  problem: {
    hmw: 'How might we automatically protect community tomato beds from 40°C heat scalding while delivering targeted root moisture so that local volunteers save water and preserve crop yield?',
    who: 'Mrs. Alvarez (example community gardener persona — replace with a real local stakeholder) and volunteer gardeners at the local community garden during summer heatwaves.',
    why: 'Peak afternoon sun causes soil surface evaporation of up to 48%, dries root zones in raised beds within 3 hours, and forces elderly volunteers to haul heavy hoses in dangerous heat-index conditions.',
    criteria: '1. Reduce water use by ≥40% vs manual hosing.\n2. Keep root soil temp ≤28°C under 38°C ambient heat.\n3. Reliable battery operation for at least 7 days.\n4. Clear physical status display for gardeners.',
    constraints: '1. Upcycled chassis materials (< $20 BOM budget).\n2. 5V DC low-voltage limit for child and garden safety.\n3. Must fit within 60cm x 40cm raised bed parcel.',
    impactMeasure: 'Water consumed (liters/week) measured via reservoir graduated scale; root soil temperature (°C) continuously logged via DS18B20 digital probe over 14-day cycle.'
  },
  impact: 'both',
  codeLanguage: 'micropython',
  finalFormat: 'showcase',
  tasksDone: {
    explore: [0, 1, 2, 3],
    empathise: [0, 1, 2, 3],
    define: [0, 1, 2, 3],
    ideate: [0, 1, 2, 3],
    prototype: [0, 1, 2, 3],
    test: [0, 1, 2, 3],
    share: [0, 1, 2]
  },
  sensorState: {
    ambientTemp: 34.2,
    soilMoisturePct: 62,
    canopyDeployed: true,
    pumpActive: false,
    waterLevelPct: 84
  },
  evidence: [
    {
      id: 'ev-exp-01',
      phase: 'explore',
      kind: 'note',
      title: 'STEAM Lab 1: Evaporation Rates & Thermal Decay of Soil',
      body: 'We tested 3 soil pans under 100W heat lamps for 45 minutes: (1) Bare dark loam, (2) Soil with straw mulch, (3) Soil with reflective Mylar canopy. The bare soil lost 28 mL of moisture in 45 min and reached 41.5°C. The Mylar canopy reflected radiation away, keeping the surface at 26.8°C with only 4 mL moisture loss! This proved reflective shading is 6x more effective than passive mulch alone.',
      competencies: ['ctps-01', 'ctps-03', 'sdl-05'],
      createdAt: 1775800000000,
      metrics: [
        { label: 'Bare Soil Temp Peak', value: '41.5°C' },
        { label: 'Reflective Canopy Temp', value: '26.8°C' },
        { label: 'Thermal Delta', value: '-14.7°C' }
      ]
    },
    {
      id: 'ev-exp-02',
      phase: 'explore',
      kind: 'data',
      title: 'Capacitive Moisture Sensor Calibration Curve',
      body: 'Calibrated our capacitive soil sensor on micro:bit Pin 0 (ADC range 0-1023). Unlike cheap resistive probes with exposed metal pins that corrode through electrolysis, this capacitive probe is insulated by solder resist.\n\nCalibration points:\n- Air (0% water): 810 ADC\n- Dry garden soil (wilting point): 670 ADC\n- Optimal damp soil: 460 - 520 ADC\n- Water saturation (100%): 340 ADC\n\nWe set our target watering trigger at 650 ADC (lower reading = more moist).',
      link: 'https://github.com/InnovationCoach/Playground/tree/DonPBL',
      competencies: ['ctps-05', 'ct-05'],
      createdAt: 1775900000000
    },
    {
      id: 'ev-emp-01',
      phase: 'empathise',
      kind: 'feedback',
      title: 'Interview with Example Community Garden Persona (Mrs. Alvarez, example persona)',
      body: '"During the July heatwave, I lost 60% of our cherry tomato plants because I could only visit before 8 AM and after 6 PM. Midday heat was over 39°C and my doctor told me not to be out in the sun. When I arrived in the evening, the soil was baked hard like concrete. If something could just shade them and give a quick drink at noon, it would save our harvest."',
      competencies: ['ec-05', 'sea-01'],
      createdAt: 1776400000000
    },
    {
      id: 'ev-emp-02',
      phase: 'empathise',
      kind: 'media',
      title: 'Persona Empathy Map & Midday Site Audit Photos',
      body: 'Observed the community plot at 13:00 on Wednesday. Recorded ambient air at 37.4°C and soil surface at 44.1°C. Tomato leaves showed severe midday epinasty (downward leaf curling). We mapped Mrs. Alvarez (example persona)\'s emotional journey: high pride during spring planting transitioning into anxiety and physical exhaustion during summer.',
      link: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb22513?w=800',
      competencies: ['sea-01', 'lc-01'],
      createdAt: 1776500000000
    },
    {
      id: 'ev-def-01',
      phase: 'define',
      kind: 'note',
      title: 'Criteria and Constraints Matrix with Quantitative Targets',
      body: 'Finalized our engineering contract:\n- Criteria 1: Water reduction ≥ 40% (measured in mL applied per week vs 2500 mL baseline).\n- Criteria 2: Root zone temp ≤ 28°C under peak ambient sun.\n- Criteria 3: Visual indicator visible from 3 meters.\n- Constraint 1: Powered by 5V rechargeable USB bank or 2xAA + boost.\n- Constraint 2: Safe low-voltage isolation (no pumps inside the electrical enclosure).\n- Constraint 3: Upcycled structural parts under $15.',
      competencies: ['ctps-01', 'ctps-02', 'sdl-01'],
      createdAt: 1777100000000
    },
    {
      id: 'ev-ide-01',
      phase: 'ideate',
      kind: 'ai',
      title: 'AI Co-Pilot Planning: State Machine & Hysteresis Logic',
      body: 'Consulted the PBL Studio AI Co-Pilot to plan how to prevent the servo and pump from constantly toggling on/off when readings fluctuate around the threshold.',
      competencies: ['ctps-02', 'ct-03', 'sdl-03'],
      createdAt: 1777700000000,
      ai: {
        asked: 'How do I write a finite state machine in MicroPython for micro:bit that reads soil moisture on pin0 and temperature on a digital pin, without turning the pump and servo on and off every 2 seconds if the reading hovers around the threshold?',
        gave: 'Recommended implementing a 2-point hysteresis threshold: activate pump when ADC > 660, and only turn off when ADC drops below 540. For the canopy servo, added a 5-minute debounce cooldown timer so cloud shadows do not cause rapid flapping. Suggested an explicit State Machine: STATE_IDLE, STATE_SHADING, STATE_WATERING, STATE_COOLDOWN.',
        kept: 'We adopted the 2-point hysteresis band (660/540 ADC) and the 5-minute debounce timer for the servo. We rejected having separate independent threads because micro:bit MicroPython is single-threaded; instead we implemented a non-blocking millis() timer loop.'
      }
    },
    {
      id: 'ev-ide-02',
      phase: 'ideate',
      kind: 'media',
      title: 'Crazy Eights Concept Sketches & Morphological Decision Matrix',
      body: 'Sketched 8 divergent canopy designs. Down-selected between a rolling scroll, an umbrella linkage, and a dual-lever accordion swing arm. Selected the dual-lever swing arm because it uses only one SG90 servo motor (saving 200mA of power) and has zero sliding track friction that could jam with outdoor dirt.',
      link: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800',
      competencies: ['ct-02', 'ct-03', 'lc-02'],
      createdAt: 1777800000000
    },
    {
      id: 'ev-pro-01',
      phase: 'prototype',
      kind: 'code',
      title: 'EcoCool Control Loop v2.4 (micro:bit MicroPython)',
      body: `# EcoCool Autonomous Garden Guardian v2.4
# Team EcoCool: Maya Chen & Leo Rossi
# Hardware: BBC micro:bit V2 + Capacitive Moisture (Pin0) + Servo (Pin1) + Relay (Pin2)

from microbit import *

# Calibration thresholds (ADC 0-1023)
DRY_THRESHOLD = 650     # Trigger pump if ADC > 650 (soil dry)
WET_THRESHOLD = 520     # Shut off pump once ADC < 520 (soil damp)
TEMP_HEAT_LIMIT = 31    # Deploy shade canopy if temp >= 31 deg C

# State flags
canopy_deployed = False
pump_running = False
last_water_time = 0
WATER_TIMEOUT_MS = 3500 # Max 3.5 seconds pump pulse to prevent flooding

def set_servo_angle(pin, angle):
    # SG90 50Hz PWM: 0 deg = ~25, 180 deg = ~125 duty
    duty = int(25 + (angle / 180.0) * 100)
    pin.set_analog_period(20)
    pin.write_analog(duty)
    sleep(400)
    pin.write_analog(0) # Sleep servo to save power and stop buzzing!

display.show(Image.HAPPY)
pin2.write_digital(0) # Ensure pump is off initially
set_servo_angle(pin1, 0) # Retract canopy initially

while True:
    # 1. Read sensors
    moisture_raw = pin0.read_analog()
    current_temp = temperature() # Built-in thermistor proxy
    
    # 2. Canopy Shading Logic
    if current_temp >= TEMP_HEAT_LIMIT and not canopy_deployed:
        display.show(Image.CONFUSED)
        set_servo_angle(pin1, 115) # Deploy Mylar shade arm
        canopy_deployed = True
    elif current_temp < (TEMP_HEAT_LIMIT - 3) and canopy_deployed:
        display.show(Image.HAPPY)
        set_servo_angle(pin1, 0) # Retract shade
        canopy_deployed = False
        
    # 3. Precision Drip Pulsing Logic
    if moisture_raw > DRY_THRESHOLD and not pump_running:
        display.show(Image.ARROW_S)
        pin2.write_digital(1) # Turn on 5V relay pump
        sleep(WATER_TIMEOUT_MS)
        pin2.write_digital(0) # Shut off pump
        sleep(2000) # Allow moisture to diffuse through soil
        display.show(Image.HAPPY)
        
    # Diagnostic blink
    display.set_pixel(4, 4, 9)
    sleep(100)
    display.set_pixel(4, 4, 0)
    sleep(900)`,
      competencies: ['ct-05', 'ctps-05', 'sdl-03'],
      createdAt: 1778300000000
    },
    {
      id: 'ev-pro-02',
      phase: 'prototype',
      kind: 'ai',
      title: 'AI Debugging Log: Resolving Servo Motor Buzz & Voltage Brownouts',
      body: 'When our servo motor deployed the canopy, the micro:bit would occasionally freeze or restart, and the motor would emit a high-pitched buzzing sound.',
      competencies: ['ctps-12', 'ct-05'],
      createdAt: 1778400000000,
      ai: {
        asked: 'Why does my micro:bit V2 restart when my SG90 servo motor reaches 120 degrees, and why does the servo buzz continuously when holding the canopy open?',
        gave: 'Identified two distinct issues: (1) Brownout restart occurs because the servo stall current (~500mA) exceeds what the micro:bit 3.3V pin can supply, causing the internal regulator to drop voltage and trigger a reset. Connect servo VCC to an external 5V rail with shared common ground. (2) Buzzing occurs because continuous 50Hz PWM signal fights the gear backlash under mechanical load. Fix in code by writing 0 duty cycle after the sweep completes (pin.write_analog(0)), relaxing the motor while the gear friction holds the canopy.',
        kept: 'We separated the servo power to a 5V rechargeable power bank while keeping GND tied to micro:bit GND. In our code we added sleep(400) followed by pin.write_analog(0). This completely eliminated both the restarts and the motor buzzing!'
      }
    },
    {
      id: 'ev-pro-03',
      phase: 'prototype',
      kind: 'media',
      title: 'Physical Chassis Build & Electronics Isolation Enclosure',
      body: 'Assembled the 45cm chassis using recycled basswood dowels and corrugated plastic. Mounted the 2L reservoir bottle with silicone drip tube and anti-siphon siphon-break hole. The micro:bit is elevated 15cm above soil in a clear upcycled plastic enclosure to protect from splashes.',
      link: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800',
      competencies: ['ct-03', 'ct-05', 'lc-04'],
      createdAt: 1778500000000
    },
    {
      id: 'ev-test-01',
      phase: 'test',
      kind: 'data',
      title: 'Controlled 14-Day Experimental Test Trial Data',
      body: 'Conducted a 14-day controlled stress test comparing Bed A (EcoCool Autonomous System) vs Bed B (Standard Daily Manual Hose Watering).\n\nResults Summary:\n- Baseline Manual Water Applied: 22.4 Liters over 14 days\n- EcoCool System Water Applied: 13.2 Liters over 14 days\n- Total Water Saved: 9.2 Liters (41.1% Reduction! Exceeded 40% target!)\n- Peak Midday Root Soil Temp (Control): 37.8°C\n- Peak Midday Root Soil Temp (EcoCool): 26.4°C (11.4°C cooler!)\n- Tomato Seedling Vigor Score: EcoCool 4.8 / 5.0 vs Control 2.9 / 5.0.',
      competencies: ['ctps-03', 'ctps-02', 'ct-12'],
      createdAt: 1779200000000,
      metrics: [
        { label: 'Water Savings', value: '41.1%' },
        { label: 'Root Temp Shielding', value: '26.4°C max' },
        { label: 'Seedling Vigor Score', value: '4.8 / 5.0' },
        { label: 'Testing Trials', value: '3 full trials' }
      ]
    },
    {
      id: 'ev-test-02',
      phase: 'test',
      kind: 'feedback',
      title: 'Stakeholder Usability Evaluation with Garden Volunteers',
      body: 'Invited 3 community gardeners to test the system interface. Feedback was overwhelmingly positive on the automatic shading. However, gardener Ken pointed out: "If the 2L bottle runs dry while I am away for the weekend, the micro:bit will keep trying to pump and could burn out the motor." Based on this, we added a software run-time limiter that locks out the pump if 3 consecutive pulses fail to lower the moisture ADC.',
      competencies: ['lc-02', 'sea-04'],
      createdAt: 1779300000000
    },
    {
      id: 'ev-test-03',
      phase: 'test',
      kind: 'note',
      title: 'Before & After Engineering Improvement: Anti-Siphon Valve & Run-Time Lockout',
      body: 'Verified two major improvements:\n1. Hardware: Added a pinhole siphon break 2cm above the reservoir water line. Before this, water slowly dripped out through siphon effect even after pump stopped, wasting 400mL. After adding the siphon break: 0mL leakage.\n2. Software: Added failsafe counter. If moisture does not improve after 3 pulses in 1 hour, pump locks out and LED displays an emergency cross icon.',
      competencies: ['ctps-02', 'ct-12'],
      createdAt: 1779400000000
    },
    {
      id: 'ev-sha-01',
      phase: 'share',
      kind: 'media',
      title: 'Showcase Expo Booth Layout & Working Hardware Rig',
      body: 'Finalized our interactive demonstration table for the school STEAM Showcase Expo! Includes a live heat lamp visitors can switch on to watch the servo canopy sweep into place, a live moisture sensor demo in potting soil, and our water savings telemetry charts.',
      link: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800',
      competencies: ['ec-11', 'ec-03', 'ec-12'],
      createdAt: 1779900000000
    },
    {
      id: 'ev-sha-02',
      phase: 'share',
      kind: 'reflection',
      title: 'Final Term Reflection: Growth, Engineering Resilience & Ethical AI',
      body: 'Looking back on the past 12 weeks, our biggest growth was in Self-Directed Learning (sdl-04) and Computational Debugging (ctps-12). When our servo brownout kept crashing the micro:bit in Week 8, we were frustrated and almost gave up on automated shading. Using the AI Co-Pilot to understand electrical brownouts taught us how real engineers work—we did not just copy code, we had to understand PWM duty cycles and power rails. Our system saved 41.1% of water in our trials and kept tomato roots 11°C cooler. Most importantly, Mrs. Alvarez (example persona) told us she wants to install 4 of these in the community garden this summer!',
      competencies: ['sdl-04', 'ctps-04', 'sea-04'],
      createdAt: 1780000000000
    }
  ]
};

// Additional Invented Student Teams for the Teacher View (All team and student names below are fictional fixtures)
export const MOCK_COHORT: StudentProject[] = [
  SAMPLE_STUDENT_PROJECT,
  {
    id: 'proj-hydroshade-02',
    teamName: 'Team HydroShade',
    members: ['Sofia Patel (Grade 8)', 'Liam O\'Connor (Grade 7)'],
    gradeLevel: 'Grade 8 (Age 13)',
    termId: 'term-2026-t3',
    currentPhase: 'prototype',
    progressPercent: 68,
    drivingQuestion: 'How might we use evaporative cooling misting nozzles triggered by soil and humidity sensors to protect fragile herb beds from heat shock?',
    problem: {
      hmw: 'How might we pulse high-pressure mist over delicate basil seedlings so that leaves do not scorch in midday sun?',
      who: 'School rooftop herb garden maintenance team.',
      why: 'Basil and coriander wilt and flower prematurely when temperatures stay above 32°C for more than 2 hours.',
      criteria: '1. Maintain humidity >50% around herbs.\n2. Use less than 500mL water/day.\n3. Automatic sensor shut-off during rain.',
      constraints: '1. Ultrasonic piezo mist disc (<$8).\n2. Battery operation for 5 days.',
      impactMeasure: 'Ambient humidity % and leaf turgor score measured daily.'
    },
    impact: 'environment',
    codeLanguage: 'micropython',
    finalFormat: 'showcase',
    tasksDone: {
      explore: [0, 1, 2, 3],
      empathise: [0, 1, 2],
      define: [0, 1, 2],
      ideate: [0, 1, 2],
      prototype: [0, 1]
    },
    sensorState: {
      ambientTemp: 32.5,
      soilMoisturePct: 54,
      canopyDeployed: false,
      pumpActive: true,
      waterLevelPct: 62
    },
    evidence: [
      {
        id: 'ev-hs-01',
        phase: 'explore',
        kind: 'note',
        title: 'Misting Evaporative Cooling Lab',
        body: 'Investigated latent heat of vaporization with piezo atomizing discs. Ambient temp dropped 4.2°C within 30 seconds of mist burst.',
        competencies: ['ctps-01', 'sdl-05'],
        createdAt: 1775850000000
      },
      {
        id: 'ev-hs-02',
        phase: 'prototype',
        kind: 'code',
        title: 'Piezo Ultrasonic Driver Pulse Code',
        body: '# Ultrasonic mist disc pulsed on micro:bit Pin 8\nfrom microbit import *\npin8.write_digital(1)\nsleep(1500)\npin8.write_digital(0)',
        competencies: ['ct-05', 'ctps-05'],
        createdAt: 1778350000000
      }
    ]
  },
  {
    id: 'proj-bioshield-03',
    teamName: 'Team BioShield',
    members: ['Marcus Vance (Grade 9)', 'Chloe Zhang (Grade 9)'],
    gradeLevel: 'Grade 9 (Age 14-15)',
    termId: 'term-2026-t3',
    currentPhase: 'define',
    progressPercent: 38,
    drivingQuestion: 'How might we use recycled thermal curtains and soil temperature telemetry to protect community spinach patches from premature bolting?',
    problem: {
      hmw: 'How might we keep cool-season spinach root zones below 24°C during unexpected spring heatwaves so that crops do not bolt?',
      who: 'Community food bank vegetable growers.',
      why: 'Spinach turns bitter and goes to seed within 48 hours of root temperatures exceeding 25°C.',
      criteria: '1. Root zone temp maintained below 24°C.\n2. Audio alert when thermal threshold exceeded.',
      constraints: '1. Recycled thermal curtain fabric only.\n2. Micro:bit V2 buzzer for alerts.',
      impactMeasure: 'Days of edible spinach harvest extended.'
    },
    impact: 'both',
    codeLanguage: 'makecode',
    finalFormat: null,
    tasksDone: {
      explore: [0, 1, 2],
      empathise: [0, 1],
      define: [0, 1]
    },
    sensorState: {
      ambientTemp: 27.1,
      soilMoisturePct: 70,
      canopyDeployed: false,
      pumpActive: false,
      waterLevelPct: 90
    },
    evidence: [
      {
        id: 'ev-bs-01',
        phase: 'explore',
        kind: 'note',
        title: 'Spinach Bolting Temperature Thresholds',
        body: 'Researched botanical thermal limits for spinach varieties. Found that soil temperature is 2x more predictive of bolting than air temperature.',
        competencies: ['sdl-05', 'ctps-03'],
        createdAt: 1775820000000
      }
    ]
  },
  {
    id: 'proj-solguard-04',
    teamName: 'Team SolGuard (New Student Empty State)',
    members: ['Aiden Tanaka (Grade 7)', 'Emma Dubois (Grade 8)'],
    gradeLevel: 'Grade 7-8 (Age 12-13)',
    termId: 'term-2026-t3',
    currentPhase: 'explore',
    progressPercent: 4,
    drivingQuestion: 'How might we use sensor-guided micro-irrigation to protect community garden beds?',
    problem: {
      hmw: '',
      who: '',
      why: '',
      criteria: '',
      constraints: '',
      impactMeasure: ''
    },
    impact: null,
    codeLanguage: 'micropython',
    finalFormat: null,
    tasksDone: {},
    sensorState: {
      ambientTemp: 24.0,
      soilMoisturePct: 45,
      canopyDeployed: false,
      pumpActive: false,
      waterLevelPct: 100
    },
    evidence: []
  },
  {
    id: 'proj-sproutguard-05',
    teamName: 'Team SproutGuard (Primary Track / Ages 9–11)',
    members: ['Liam Chen (Grade 5)', 'Sofia Al-Mansoor (Grade 5)'],
    gradeLevel: 'Primary Track (Grade 5 / Age 10-11)',
    termId: 'term-2026-t3',
    currentPhase: 'prototype',
    progressPercent: 65,
    drivingQuestion: 'How can we build a singing cardboard garden sentinel with micro:bit that tells our school gardener when strawberry plants need water?',
    problem: {
      hmw: 'How might we use happy musical tunes and LED emojis to remind younger students to water strawberry garden beds?',
      who: 'Primary school gardening club and cafeteria compost team.',
      why: 'Strawberries dry out quickly in small raised beds when students forget to check moisture during recess.',
      criteria: '1. Play cheerful chime when soil is moist.\n2. Sad icon and flashing LED when soil is dry.\n3. Water-resistant decorated cardboard house.',
      constraints: '1. Visual MakeCode blocks only.\n2. Recycled craft materials and alligator clips.',
      impactMeasure: 'Zero dried strawberry plants over a 3-week test window.'
    },
    impact: 'both',
    codeLanguage: 'makecode',
    finalFormat: 'interactive-stand',
    tasksDone: {
      explore: [0, 1, 2],
      empathise: [0, 1],
      define: [0, 1],
      ideate: [0, 1],
      prototype: [0, 1]
    },
    sensorState: {
      ambientTemp: 28.4,
      soilMoisturePct: 68,
      canopyDeployed: true,
      pumpActive: false,
      waterLevelPct: 85
    },
    evidence: [
      {
        id: 'ev-sg-01',
        phase: 'explore',
        kind: 'note',
        title: 'Primary STEAM Discovery: Sponge Moisture vs. Garden Soil',
        body: 'Tested our capacitive probe in dry kitchen sponge vs. damp sponge vs. water cup. We drew color-coded dial meters in our project journals.',
        competencies: ['ctps-01', 'ct-01'],
        createdAt: 1775830000000
      },
      {
        id: 'ev-sg-02',
        phase: 'prototype',
        kind: 'code',
        title: 'MakeCode Block Chime Logic (Exported JS)',
        body: '// MakeCode Visual Blocks exported code\nbasic.forever(function () {\n    let reading = pins.analogReadPin(AnalogPin.P0)\n    if (reading < 400) {\n        basic.showIcon(IconNames.Sad)\n        music.playTone(262, music.beat(BeatFraction.Whole))\n    } else {\n        basic.showIcon(IconNames.Happy)\n    }\n})',
        competencies: ['ct-05', 'lc-02'],
        createdAt: 1778320000000
      }
    ]
  },
  {
    id: 'proj-aeropulse-06',
    teamName: 'Team AeroPulse (Upper Secondary Track / Ages 15–17)',
    members: ['Kai Takahashi (Grade 11)', 'Elena Rostova (Grade 11)'],
    gradeLevel: 'Upper Secondary Track (Grade 11 / Age 16-17)',
    termId: 'term-2026-t3',
    currentPhase: 'test',
    progressPercent: 88,
    drivingQuestion: 'How might we engineer parametric multi-axis solar tracking canopies and predictive transpiration models to protect urban community greenhouses?',
    problem: {
      hmw: 'How might we minimize vapor-pressure deficits (VPD) in high-density urban poly-tunnels using automated dual-axis Mylar louvers and predictive micro-climate telemetry?',
      who: 'Commercial urban hydroponic farmers and community food resilience networks.',
      why: 'Extreme noon VPD spikes exceed 3.5 kPa, causing stomatal closure, thermal leaf scorch, and severe nutrient lockup.',
      criteria: '1. Maintain leaf temperature within +/- 1.5°C of optimal 24°C.\n2. Continuous logging via I2C bus.\n3. Parametric 3D CAD linkage with low parasitic power.',
      constraints: '1. Less than 15W total system power drawn from solar buffer.\n2. Real-time serial telemetry.',
      impactMeasure: 'Reduction in crop stress index and 42% lower peak afternoon canopy temps.'
    },
    impact: 'both',
    codeLanguage: 'micropython',
    finalFormat: 'stage-pitch',
    tasksDone: {
      explore: [0, 1, 2],
      empathise: [0, 1],
      define: [0, 1],
      ideate: [0, 1],
      prototype: [0, 1, 2],
      test: [0, 1]
    },
    sensorState: {
      ambientTemp: 31.8,
      soilMoisturePct: 74,
      canopyDeployed: true,
      pumpActive: false,
      waterLevelPct: 92
    },
    evidence: [
      {
        id: 'ev-ap-01',
        phase: 'explore',
        kind: 'data',
        title: 'Vapor-Pressure Deficit (VPD) Mathematical Model',
        body: 'Derived mathematical approximation of saturation vapor pressure: $VPD = VP_{sat} \\times (1 - RH/100)$. Calibrated with psychrometric data from DHT22 ambient probe.',
        competencies: ['ctps-05', 'ctps-12'],
        createdAt: 1775800000000,
        metrics: [
          { label: 'Baseline Peak VPD', value: '3.62 kPa' },
          { label: 'Shielded Peak VPD', value: '1.41 kPa' }
        ]
      },
      {
        id: 'ev-ap-02',
        phase: 'test',
        kind: 'code',
        title: 'Embedded MicroPython PID Control Loop',
        body: '# MicroPython Non-Blocking State Machine with PID Temperature Tuning\nfrom microbit import *\n# Full PID loop regulating servo PWM duty cycles against thermal lag',
        competencies: ['ct-05', 'ctps-02'],
        createdAt: 1779200000000
      }
    ]
  },
  {
    id: 'proj-entrepreneur-brass-06',
    teamName: 'Team BrassGrip (Entrepreneurship: Product Creation)',
    members: ['Kavita Sharma (Grade 8)', 'Niran Kittisuk (Grade 9)'],
    gradeLevel: 'Grade 8-9 (Age 13-14)',
    termId: 'term-2026-t3',
    currentPhase: 'test',
    progressPercent: 78,
    drivingQuestion: 'How might we engineer a modular padded utility strap pocket for brass musicians that eliminates damaged accessories with sustainable 62% unit margins in Thai Baht?',
    problem: {
      hmw: 'How might we keep trumpet valve oils and sheet music securely accessible on the exterior of standard hard cases without puncturing containers or denting instruments?',
      who: 'Middle school brass musicians carrying instruments on foot and public transit',
      why: 'Standard hard-shell instrument cases lack compartmentalized, padded utility pockets, leading to dented parts and crushed accessories',
      criteria: 'Attaches in < 15 seconds, survives 2kg pull force, cost under 50 THB to produce, retail under 130 THB',
      constraints: 'Scrap/recycled nylon straps, hot glue/eyelet fasteners, silent usability pass with 0 hints',
      impactMeasure: 'Zero damaged sheet music or crushed valve oils across 3-week field trial'
    },
    impact: 'both',
    codeLanguage: 'python',
    finalFormat: 'stage-pitch',
    tasksDone: {
      explore: [0, 1, 2, 3],
      empathise: [0, 1, 2, 3],
      define: [0, 1, 2, 3],
      ideate: [0, 1, 2, 3],
      prototype: [0, 1, 2],
      test: [0, 1]
    },
    sensorState: {
      ambientTemp: 29.5,
      soilMoisturePct: 0,
      canopyDeployed: false,
      pumpActive: false,
      waterLevelPct: 0
    },
    evidence: [
      {
        id: 'ev-ent-01',
        phase: 'explore',
        kind: 'note',
        title: 'Friction Log: Brass Instrument Transport Annoyances',
        body: 'Carried log for 48 hours across school band rehearsals and transit. Entry 1: Trumpet valve oil bottle cap unscrewed inside backpack, ruining 3 sheets of jazz orchestra scores. Entry 2: Friend dropped mute onto concrete because both hands were holding trumpet case. Entry 3: Locker jammed trying to squeeze oversized bag.',
        competencies: ['sdl-01', 'ctps-01', 'ent-01'],
        createdAt: 1775810000000
      },
      {
        id: 'ev-ent-02',
        phase: 'empathise',
        kind: 'feedback',
        title: 'Customer Empathy Interviews: 5 Brass Musicians',
        body: 'Interviewed 5 band members using the past-behavior core without leading questions. Quote 1 (Leo, trombone): "My valve oil leaked on my band uniform last month; my parents were furious." Quote 2 (Mei, trumpet): "I have to carry a separate tote bag just for my tuner and pencils." 4 out of 5 validated this as an acute daily nuisance.',
        competencies: ['ec-01', 'lc-01', 'ent-01'],
        createdAt: 1776500000000
      },
      {
        id: 'ev-ent-03',
        phase: 'ideate',
        kind: 'media',
        title: 'Crazy 8s Sketches & Track Committal Matrix',
        body: 'Completed 8 sketches in 8 minutes. Explored conventional sleeves, scrap banner harnesses, modular clip-ons, and magnetic clamps. Committed to Track A: Physical Build (Feasibility 5/5, Desirability 5/5, Durability 4/5).',
        competencies: ['ctps-02', 'ent-01'],
        createdAt: 1777200000000
      },
      {
        id: 'ev-ent-04',
        phase: 'prototype',
        kind: 'media',
        title: 'Cardboard & Webbing 1:1 Scale Prototype v1.0',
        body: 'Fabricated initial 1:1 scale pocket using upcycled nylon webbing and foam core. Tested on standard Yamaha trumpet case. Red-marker inspection revealed strap slipped when walking briskly.',
        competencies: ['ctps-04', 'ent-02'],
        createdAt: 1778100000000
      },
      {
        id: 'ev-ent-05',
        phase: 'test',
        kind: 'data',
        title: 'Silent Usability Lab & v1.1 Iteration',
        body: 'Tested with 3 naive peers under strict Silent Rule. Tester 1 hesitated 8 seconds looking for the buckle latch. Tester 2 pulled the strap backward. Iterated to v1.1: Added high-contrast yellow pull-tab and reinforced cross-stitch webbing.',
        competencies: ['ctps-05', 'ent-02', 'ec-02'],
        createdAt: 1778900000000,
        metrics: [
          { label: 'Tester Hesitation (v1.0)', value: '8.2 sec' },
          { label: 'Tester Hesitation (v1.1)', value: '1.4 sec' },
          { label: 'Strap Pull Resistance', value: '4.8 kg' }
        ]
      },
      {
        id: 'ev-ent-06',
        phase: 'test',
        kind: 'data',
        title: 'Unit Economics & COGS Ledger (Thai Baht)',
        body: 'COGS breakdown: Heavy webbing strap (20 THB) + Foam padding (8 THB) + Zipper assembly (12 THB) + Packaging & sticker (5 THB) = Unit Floor Cost 45 THB. Target retail price: 120 THB (62.5% Gross Margin). Startup capital for eyelet tool and rivets: 1,200 THB. Break-Even Volume = 1,200 / (120 - 45) = 16 units.',
        competencies: ['ctps-12', 'ent-02'],
        createdAt: 1779300000000,
        metrics: [
          { label: 'Unit Floor Cost', value: '45.00 THB' },
          { label: 'Retail Price', value: '120.00 THB' },
          { label: 'Gross Profit Margin', value: '62.5%' },
          { label: 'Break-Even Units', value: '16 units' }
        ]
      }
    ]
  }
];

// Invented Coach Fixture (Fictional persona for offline Teacher View demo; real app uses signed-in coach profile)
export const MOCK_TEACHER = {
  id: 'coach-vance',
  name: 'Coach Eleanor Vance (Synthetic Fixture)',
  role: 'STEAM & PBL Lead Facilitator',
  school: 'WeLearn Academy',
  cohortSize: 28,
  activeProjects: 14
};

// Separate Coach Feedback Fixtures keyed by student/team uid (kept off StudentProject so students and coaches never write to the same Firestore document)
// All coach names below are invented synthetic fixtures.
export const INITIAL_COACH_FEEDBACK: Record<string, CoachFeedback[]> = {
  "proj-ecocool-01": [
    {
      "coachName": "Coach Eleanor Vance (Synthetic Fixture)",
      "date": "2026-09-22",
      "note": "Exceptional evidence documentation. The calibration data curve and the thoughtful AI log in the Prototype phase demonstrate true mastery. You clearly understand why the servo power separation was required. Ready for final Showcase!",
      "competencyScores": {
        "sdl-04": 4,
        "ctps-01": 4,
        "ctps-05": 4,
        "ctps-12": 4,
        "ct-05": 4,
        "ec-11": 3,
        "sea-01": 4
      }
    }
  ],
  "proj-hydroshade-02": [
    {
      "coachName": "Coach Eleanor Vance (Synthetic Fixture)",
      "date": "2026-09-18",
      "note": "Solid progress on the ultrasonic misting module. Make sure to complete your multi-trial test table in the next phase.",
      "competencyScores": {
        "ctps-01": 3,
        "ct-05": 3,
        "sdl-02": 3
      }
    }
  ],
  "proj-bioshield-03": [],
  "proj-solguard-04": [],
  "proj-sproutguard-05": [
    {
      "coachName": "Coach Eleanor Vance (Synthetic Fixture)",
      "date": "2026-09-22",
      "note": "Inspiring visual storytelling and clean MakeCode blocks! The primary gardening club will love your chime alerts.",
      "competencyScores": {
        "ctps-01": 4,
        "lc-02": 4,
        "ct-05": 3
      }
    }
  ],
  "proj-aeropulse-06": [
    {
      "coachName": "Coach Eleanor Vance (Synthetic Fixture)",
      "date": "2026-09-24",
      "note": "Exemplary mathematical rigor and embedded code architecture. Ready for submission to regional engineering fairs.",
      "competencyScores": {
        "ctps-05": 4,
        "ctps-12": 4,
        "ct-05": 4
      }
    }
  ],
  "proj-entrepreneur-brass-06": [
    {
      "coachName": "Coach Eleanor Vance (Synthetic Fixture)",
      "date": "2026-10-02",
      "note": "Outstanding execution of the Silent Rule and unit economics. Financial breakdown is crystal clear and ready for the 3-minute pitch arena.",
      "competencyScores": {
        "ctps-05": 4,
        "ent-01": 4,
        "ent-02": 4,
        "ec-01": 4
      }
    }
  ]
};
