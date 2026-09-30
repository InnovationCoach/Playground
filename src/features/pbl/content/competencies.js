/**
 * The school's competency framework, generated from "WeLearn Academy.xlsx"
 * (sheet "Competencies", supplied 2026-09-28). Text is the school's own and is
 * kept VERBATIM - do not tidy it here; fix it in the spreadsheet and regenerate.
 *
 * `id` is ours and stable (domain + row order). `code` is the school's number,
 * which is NOT unique in the source - see COMPETENCY_DATA_ISSUES.
 */
export const COMPETENCY_DOMAINS = [
  {
    "id": "sdl",
    "title": "Self-directed Learning",
    "description": "Self-directed learning is the ability to take full responsibility for one’s academic and personal development. This includes setting meaningful goals, strategically planning learning pathways, independently managing time and resources, continuously reflecting on progress, and adapting to feedback and setbacks. It is a key attribute of future-ready individuals prepared for higher education and the demands of dynamic global industries."
  },
  {
    "id": "ctps",
    "title": "Critical Thinking and Problem Solving",
    "description": "Critical Thinkers always ask \"why\" and are not satisfied with the answer to a question until they fully understand not only what the answer is but why it's the answer."
  },
  {
    "id": "lc",
    "title": "Leadership and Collaboration",
    "description": "Learners are able to successfully work both independently and as part of a team and make informed decisions as to when to lead or follow, using influence where appropriate, with understanding and empathy."
  },
  {
    "id": "ec",
    "title": "Effective Communication",
    "description": "It doesn't matter how good an idea is if you can't let other people know about it in a way that allows them to not only understand but also empathize with your goals for it. Both written and oral communication allow you to tell your story and invite other people to share with you."
  },
  {
    "id": "ct",
    "title": "Creative Thinking",
    "description": "Learners can create, imagine and innovate in order to address complex problems, and aid human flourishing in the sciences, humanities and arts."
  },
  {
    "id": "sea",
    "title": "Social and Emotional Aptitude",
    "description": "Learners can understand and manage emotions, build and maintain positive relationships, feel and show empathy for others, overcome challenges, and make responsible decisions."
  },
  {
    "id": "ent",
    "title": "Entrepreneurship",
    "description": "Entrepreneurship is the ability to identify opportunities, develop innovative solutions, and strategically build and manage ventures that create value and adapt to dynamic markets. It emphasizes proactive problem-solving, calculated risk-taking, and the practical application of business principles to bring ideas to life."
  }
];

export const COMPETENCIES = [
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

/**
 * Problems found in the source spreadsheet on 2026-09-28, shown to teachers on
 * the framework page so the school can fix them at source. Nothing here is
 * "corrected" in the data above.
 */
export const COMPETENCY_DATA_ISSUES = [
  { ids: ['ctps-01', 'ctps-09'], note: 'Both numbered 2.1.1.' },
  { ids: ['ctps-05', 'ctps-10'], note: 'Both numbered 2.1.5.' },
  { ids: ['lc-03', 'lc-10'], note: 'Both numbered 3.1.3.' },
  { ids: ['lc-04', 'lc-11'], note: 'Both numbered 3.1.4.' },
  { ids: ['ec-03', 'ec-11'], note: 'Both numbered 4.1.3.' },
  { ids: ['ec-05', 'ec-12'], note: 'Both numbered 4.1.5.' },
  { ids: ['ct-04', 'ct-11'], note: 'Both numbered 5.1.4.' },
  { ids: ['sea-10', 'ent-02'], note: 'Both numbered 7.1.2 (Social and Emotional Aptitude and Entrepreneurship share the 7.x numbers).' },
  { ids: ['sea-11', 'ent-05'], note: 'Both numbered 7.1.5.' },
  { ids: ['ent-06', 'ent-07', 'ent-08', 'ent-09', 'ent-10', 'ent-11'], note: 'Entrepreneurship uses 1.x numbers, which belong to Self-directed Learning (1.2.1, 1.2.4, 1.2.5 and 1.1.3 collide).' },
  { ids: ['sdl-12', 'sdl-13', 'sdl-14'], note: 'Self-directed Learning items numbered 6.2.x.' },
  { ids: ['lc-03', 'lc-04'], note: 'Conflict Resolution and Mediation has the same description as Team Commitment and Responsibility - it does not describe resolving conflict.' },
  { ids: ['sdl-14', 'sdl-07'], note: 'Self-motivation has the same description as Growth Mindset.' },
  { ids: ['ent-03', 'ent-05'], note: 'Descriptions look swapped: Startup Financial Planning describes acting on a real-world problem, and Value Proposition Development describes a startup budget.' },
  { ids: ['ent-10'], note: 'Resilience and Adaptability describes taking initiative, not resilience.' },
  { ids: ['sea-11'], note: 'Title typo: "Postive Mindset".' }
];

const byId = new Map(COMPETENCIES.map((c) => [c.id, c]));
export const competencyById = (id) => byId.get(id) || null;
export const domainById = (id) => COMPETENCY_DOMAINS.find((d) => d.id === id) || null;
