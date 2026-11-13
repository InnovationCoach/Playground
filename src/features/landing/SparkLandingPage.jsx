import { useState } from 'react';
import {
  Compass,
  Rocket,
  Palette,
  Target,
  BarChart2,
  Brain,
  Shield,
  Lightbulb,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  Sparkles,
  Heart,
  Headphones,
  Award,
  Zap,
  Globe,
  Sliders
} from 'lucide-react';
import { LOGO_URL } from '../../app/brand.js';
import { ContactAdminModal } from './ContactAdminModal.jsx';
import './landing.css';

export function SparkLandingPage({ onSignIn }) {
  const [contactOpen, setContactOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('quests');
  const [activeSkillIndex, setActiveSkillIndex] = useState(0);

  const toggleFaq = (index) => {
    setOpenFaqIndex((prev) => (prev === index ? -1 : index));
  };

  const scrollToSection = (id) => (e) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 10 Section Copy from Creative Brief (Nov 12, 2026 · @Mani)
  const realProjects = [
    {
      title: 'Hex-City Thailand',
      tag: 'Civil Engineering & Ecology',
      question: 'How might we design modular, amphibious infrastructure to protect Chao Phraya communities from rising seas?',
      meta: '12-Week Programme · High School PBL'
    },
    {
      title: 'Biomechanics & Robotics',
      tag: 'Robotics & Kinematics',
      question: 'How might we engineer bio-inspired robotic limbs using kinematic analysis and 3D prototyping?',
      meta: '12-Week Programme · Microcontroller Lab'
    },
    {
      title: 'Product Creation',
      tag: 'Sustainable Entrepreneurship',
      question: 'How might we launch a sustainable product that earns real customer pre-orders?',
      meta: '12-Week Programme · Prototype & Venture'
    },
    {
      title: 'EcoCool Urban Heat',
      tag: 'IoT & Climate Science',
      question: 'How might we use IoT sensors to fight urban heat and protect community gardens?',
      meta: '12-Week Programme · Physical Computing'
    },
    {
      title: 'The Passion Project Blueprint',
      tag: 'Independent Inquiry',
      question: 'How might an independent learner turn a passion into a public portfolio piece?',
      meta: '12-Week Programme · Capstone Portfolio'
    }
  ];

  const simulations = [
    {
      title: 'Solar Car Challenge',
      tag: 'Physics & Energy',
      desc: 'Simulate aerodynamics, battery weight, and solar irradiance across changing race conditions.'
    },
    {
      title: 'Urban Heat Battle',
      tag: 'Climate Resilience',
      desc: 'Test surface albedo, tree canopy coverage, and cool pavements to cool urban microclimates.'
    },
    {
      title: 'Bangkok Coastal Challenge',
      tag: 'Marine Ecology',
      desc: 'Model mangrove buffers and surge barriers against monsoon tides and rising sea levels.'
    },
    {
      title: 'Micro:bit Coding Lab',
      tag: 'Physical Computing',
      desc: 'Real-time sensor simulation with live code updates in MicroPython and MakeCode.'
    },
    {
      title: 'Plant Microscope Lab',
      tag: 'Cellular Biology',
      desc: 'Investigate stomatal conductance, transpiration rates, and environmental stress data.'
    },
    {
      title: 'Project Hex-Grid',
      tag: 'Urban Planning',
      desc: 'Model modular flood-resilient community structures and shared municipal renewable grids.'
    }
  ];

  const futureSkills = [
    {
      title: 'Critical Thinking',
      icon: <Brain size={20} />,
      def: 'Evaluating evidence, identifying biases, and forming reasoned conclusions under uncertainty.'
    },
    {
      title: 'Creative Problem-Solving',
      icon: <Lightbulb size={20} />,
      def: 'Generating novel, workable interventions to ambiguous, open-ended real-world challenges.'
    },
    {
      title: 'AI & Data Literacy',
      icon: <Cpu size={20} />,
      def: 'Understanding how machine learning works, verifying data claims, and prompting responsibly.'
    },
    {
      title: 'Communication & Storytelling',
      icon: <Palette size={20} />,
      def: 'Articulating technical design processes and human impact clearly to diverse audiences.'
    },
    {
      title: 'Collaboration & Empathy',
      icon: <Heart size={20} />,
      def: 'Designing for stakeholders, listening deeply, and coordinating effectively in project teams.'
    },
    {
      title: 'Self-Direction & Resilience',
      icon: <Target size={20} />,
      def: 'Setting personal milestones, diagnosing setbacks, and iterating calmly through failure.'
    },
    {
      title: 'Ethics & Digital Citizenship',
      icon: <Shield size={20} />,
      def: 'Assessing the societal consequences of technology and safeguarding private human data.'
    }
  ];

  const faqs = [
    {
      q: 'Is SPARK a replacement for academics?',
      a: 'No. It sits alongside each learner’s UK or US pathway and holds their PBL work.'
    },
    {
      q: 'Who uses it?',
      a: 'WeLearn learners aged 11–18 and their coaches.'
    },
    {
      q: 'How is AI kept safe?',
      a: 'Published ground rules, an AI log for every use, and no personal data in prompts.'
    },
    {
      q: 'Can my child try it?',
      a: 'Book a Discovery Call and we will show you SPARK live.'
    }
  ];

  return (
    <div className="spark-landing-root">
      {/* 1. Navigation Bar */}
      <header className="spark-nav">
        <div className="spark-nav-container">
          <a href="#hero" className="spark-brand-link" onClick={scrollToSection('hero')}>
            <img src={LOGO_URL} alt="WeLearn" className="spark-nav-logo" />
            <div className="spark-brand-tagline">
              <span>WeLearn</span>
              <span className="spark-brand-highlight">SPARK</span>
            </div>
          </a>

          <nav className="spark-nav-links" aria-label="Main Navigation">
            <a href="#meet-spark" className="spark-nav-link" onClick={scrollToSection('meet-spark')}>
              Platform
            </a>
            <a href="#real-projects" className="spark-nav-link" onClick={scrollToSection('real-projects')}>
              Projects
            </a>
            <a href="#simulations" className="spark-nav-link" onClick={scrollToSection('simulations')}>
              Simulations
            </a>
            <a href="#ai-copilot" className="spark-nav-link" onClick={scrollToSection('ai-copilot')}>
              AI Rules
            </a>
            <a href="#future-skills" className="spark-nav-link" onClick={scrollToSection('future-skills')}>
              Future Skills
            </a>
            <a href="#wellbeing" className="spark-nav-link" onClick={scrollToSection('wellbeing')}>
              Wellbeing
            </a>
            <a href="#faq" className="spark-nav-link" onClick={scrollToSection('faq')}>
              FAQ
            </a>
          </nav>

          <div className="spark-nav-cta">
            <button
              type="button"
              className="spark-btn-lime"
              onClick={() => setContactOpen(true)}
            >
              Book a Discovery Call
            </button>
            <button
              type="button"
              className="spark-btn-secondary"
              onClick={onSignIn}
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* 1. HERO SECTION */}
      <section id="hero" className="spark-hero-section">
        <div className="spark-hero-badge">
          <Sparkles size={14} /> Built for Gifted & Twice-Exceptional Learners
        </div>

        <h1 className="spark-hero-headline">
          AI is the co-pilot. Your child is the designer.
        </h1>

        <p className="spark-hero-subheadline">
          SPARK is WeLearn’s own learning platform, where learners aged 11–18 build real projects, grow seven Future Skills and use AI the right way.
        </p>

        <div className="spark-hero-actions">
          <button
            type="button"
            className="spark-btn-lime"
            onClick={() => setContactOpen(true)}
            style={{ fontSize: '1.05rem', padding: '0.85rem 1.85rem' }}
          >
            Book a Discovery Call
          </button>
          <button
            type="button"
            className="spark-btn-secondary"
            onClick={onSignIn}
            style={{ fontSize: '1.05rem', padding: '0.8rem 1.75rem' }}
          >
            Sign in to SPARK
          </button>
        </div>

        {/* Trust Strip */}
        <div className="spark-trust-strip">
          <span>WeLearn Academy Bangkok</span>
          <span className="spark-trust-bullet">·</span>
          <span>Member of the Mastery Transcript Consortium</span>
          <span className="spark-trust-bullet">·</span>
          <span>UK and US academic pathways</span>
          <span className="spark-trust-bullet">·</span>
          <span>Learners aged 11–18</span>
        </div>

        {/* Device Frame with Authentic Platform Screenshot */}
        <div className="spark-device-frame">
          <div className="spark-device-notch" />
          <div className="spark-device-screen">
            <img
              src="/landing/dashboard.png"
              alt="WeLearn SPARK Learner Dashboard"
              className="spark-device-img"
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* 2. THE PROBLEM */}
      <section className="spark-section">
        <div className="spark-section-container">
          <div className="spark-section-header">
            <span className="spark-section-tag">Rethinking Education</span>
            <h2 className="spark-section-title">Bright minds don’t fit in rows.</h2>
            <p className="spark-section-desc">
              Gifted and twice-exceptional teens often know more about the things they love than the textbook does. Yet most classrooms ask them to wait, repeat and compete. SPARK was built at WeLearn to do the opposite: start with their curiosity and turn it into real work.
            </p>
          </div>

          <div className="spark-problem-grid">
            <div className="spark-compare-card">
              <h3 className="spark-compare-title" style={{ color: '#64748b' }}>
                The Conventional Classroom
              </h3>
              <ul className="spark-compare-list">
                <li>
                  <span style={{ color: '#ef4444', fontWeight: 700 }}>✕</span>
                  <span>Rigid pacing forces fast thinkers to wait and repeat concepts they mastered years ago.</span>
                </li>
                <li>
                  <span style={{ color: '#ef4444', fontWeight: 700 }}>✕</span>
                  <span>Standardised ranking causes anxiety and pits learners against their peers.</span>
                </li>
                <li>
                  <span style={{ color: '#ef4444', fontWeight: 700 }}>✕</span>
                  <span>AI is treated either as cheating to be banned or a shortcut that replaces human effort.</span>
                </li>
                <li>
                  <span style={{ color: '#ef4444', fontWeight: 700 }}>✕</span>
                  <span>Assessments test memorisation rather than real problem solving and creativity.</span>
                </li>
              </ul>
            </div>

            <div className="spark-compare-card positive">
              <h3 className="spark-compare-title" style={{ color: 'var(--wl-purple)' }}>
                The WeLearn Learning Centre
              </h3>
              <ul className="spark-compare-list">
                <li>
                  <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>
                  <span>Personalised project pacing guided by authentic curiosity and depth of inquiry.</span>
                </li>
                <li>
                  <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>
                  <span>Progress displays what has been built, never ranking or comparing one child with another.</span>
                </li>
                <li>
                  <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>
                  <span>AI serves strictly as a Socratic co-pilot under published, transparent ground rules.</span>
                </li>
                <li>
                  <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>
                  <span>Evidence-based mastery portfolios that travel alongside UK and US academic pathways.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3. MEET SPARK (5 TILES) */}
      <section id="meet-spark" className="spark-section spark-section-cloud">
        <div className="spark-section-container">
          <div className="spark-section-header">
            <span className="spark-section-tag">Calm By Design</span>
            <h2 className="spark-section-title">Everything your child is building, in one place.</h2>
            <p className="spark-section-desc">
              SPARK replaces cluttered feeds and endless notification pings with five purposeful, quiet spaces.
            </p>
          </div>

          <div className="spark-tiles-grid">
            <div className="spark-tile-card">
              <div className="spark-tile-icon">
                <Rocket size={22} />
              </div>
              <h3 className="spark-tile-title">My Quests</h3>
              <p className="spark-tile-body">
                Today’s next step on their current project, never an intimidating wall of tasks.
              </p>
            </div>

            <div className="spark-tile-card">
              <div className="spark-tile-icon">
                <BarChart2 size={22} />
              </div>
              <h3 className="spark-tile-title">My Progress</h3>
              <p className="spark-tile-body">
                Sessions completed, competencies grown, and milestones reached without ranking.
              </p>
            </div>

            <div className="spark-tile-card">
              <div className="spark-tile-icon">
                <Compass size={22} />
              </div>
              <h3 className="spark-tile-title">Find a Quest</h3>
              <p className="spark-tile-body">
                Explore robotics, environmental science, space exploration, and microcontrollers.
              </p>
            </div>

            <div className="spark-tile-card">
              <div className="spark-tile-icon">
                <Palette size={22} />
              </div>
              <h3 className="spark-tile-title">Creative Space</h3>
              <p className="spark-tile-body">
                Private notes, lyrical-free focus sounds, and mindful daily check-ins.
              </p>
            </div>

            <div className="spark-tile-card">
              <div className="spark-tile-icon">
                <Globe size={22} />
              </div>
              <h3 className="spark-tile-title">My Universe</h3>
              <p className="spark-tile-body">
                Interactive missions and astronomical models to explore when curiosity wanders.
              </p>
            </div>
          </div>

          {/* Interactive Showcase Tabs with Real Images */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'inline-flex', background: '#e2e8f0', padding: 4, borderRadius: 9999, flexWrap: 'wrap', gap: 4 }}>
              <button
                type="button"
                onClick={() => setActiveTab('quests')}
                style={{
                  padding: '0.45rem 1.25rem',
                  borderRadius: 9999,
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  background: activeTab === 'quests' ? '#ffffff' : 'transparent',
                  color: activeTab === 'quests' ? 'var(--wl-purple)' : '#475569',
                  boxShadow: activeTab === 'quests' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                My Quests
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('search')}
                style={{
                  padding: '0.45rem 1.25rem',
                  borderRadius: 9999,
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  background: activeTab === 'search' ? '#ffffff' : 'transparent',
                  color: activeTab === 'search' ? 'var(--wl-purple)' : '#475569',
                  boxShadow: activeTab === 'search' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                Find a Quest
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('creative')}
                style={{
                  padding: '0.45rem 1.25rem',
                  borderRadius: 9999,
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  background: activeTab === 'creative' ? '#ffffff' : 'transparent',
                  color: activeTab === 'creative' ? 'var(--wl-purple)' : '#475569',
                  boxShadow: activeTab === 'creative' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                Creative Space
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('projects')}
                style={{
                  padding: '0.45rem 1.25rem',
                  borderRadius: 9999,
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  background: activeTab === 'projects' ? '#ffffff' : 'transparent',
                  color: activeTab === 'projects' ? 'var(--wl-purple)' : '#475569',
                  boxShadow: activeTab === 'projects' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                PBL Library
              </button>
            </div>
          </div>

          <div className="spark-device-frame" style={{ maxWidth: 940 }}>
            <div className="spark-device-notch" />
            <div className="spark-device-screen">
              <img
                src={
                  activeTab === 'search'
                    ? '/landing/quest-search.png'
                    : activeTab === 'creative'
                    ? '/landing/focus-space.png'
                    : activeTab === 'projects'
                    ? '/landing/projects.png'
                    : '/landing/dashboard.png'
                }
                alt="SPARK Interface View"
                className="spark-device-img"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4. REAL PROJECTS */}
      <section id="real-projects" className="spark-section">
        <div className="spark-section-container">
          <div className="spark-section-header">
            <span className="spark-section-tag">Project-Based Learning</span>
            <h2 className="spark-section-title">Twelve-week projects that start with “How might we…?”</h2>
            <p className="spark-section-desc">
              Every SPARK programme begins with a real question and ends with something a learner can show the world.
            </p>
          </div>

          <div className="spark-projects-grid">
            {realProjects.map((p, i) => (
              <div key={i} className="spark-project-card">
                <div>
                  <span className="spark-project-tag">{p.tag}</span>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.65rem' }}>{p.title}</h3>
                  <p className="spark-project-q">“{p.question}”</p>
                </div>
                <div className="spark-project-meta">{p.meta}</div>
              </div>
            ))}
          </div>

          <div className="spark-device-frame" style={{ maxWidth: 960 }}>
            <div className="spark-device-notch" />
            <div className="spark-device-screen">
              <img
                src="/landing/projects.png"
                alt="SPARK PBL Programmes"
                className="spark-device-img"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 5. LEARN BY SIMULATING */}
      <section id="simulations" className="spark-section spark-section-cloud">
        <div className="spark-section-container">
          <div className="spark-section-header">
            <span className="spark-section-tag">Interactive STEM Labs</span>
            <h2 className="spark-section-title">Test the idea before you build it.</h2>
            <p className="spark-section-desc">
              SPARK’s interactive STEM simulations let learners fight an urban heat island, defend Bangkok’s coastline, race a solar car or code a micro:bit, then bring the data back into their project.
            </p>
          </div>

          <div className="spark-sim-grid" style={{ marginBottom: '3rem' }}>
            {simulations.map((s, i) => (
              <div key={i} className="spark-sim-card">
                <span className="spark-sim-tag">{s.tag}</span>
                <h3 className="spark-sim-title">{s.title}</h3>
                <p className="spark-sim-desc">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="spark-device-frame" style={{ maxWidth: 960 }}>
            <div className="spark-device-notch" />
            <div className="spark-device-screen">
              <img
                src="/landing/simulation-solar.png"
                alt="Solar Car STEM Simulation"
                className="spark-device-img"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 6. AI CO-PILOT, NOT AUTOPILOT (MIDNIGHT #0F2C4C) */}
      <section id="ai-copilot" className="spark-section spark-section-midnight">
        <div className="spark-section-container">
          <div className="spark-section-header">
            <span className="spark-section-tag" style={{ color: 'var(--wl-sky)' }}>Responsible AI</span>
            <h2 className="spark-section-title">AI can write code. It can’t decide what’s worth solving.</h2>
            <p className="spark-section-desc">
              Inside SPARK, AI helps learners plan, research and write code for micro:bit, Python, Arduino and LEGO. The rules are the same for learners and coaches:
            </p>
          </div>

          <div className="spark-ai-rules-grid">
            <div className="spark-rule-card">
              <div className="spark-rule-num">01</div>
              <h3 className="spark-rule-title">Understand every line.</h3>
              <p className="spark-rule-desc">Code you cannot explain is not finished. Learners must understand why every function works.</p>
            </div>

            <div className="spark-rule-card">
              <div className="spark-rule-num">02</div>
              <h3 className="spark-rule-title">Aim it at a real need.</h3>
              <p className="spark-rule-desc">Every project names who benefits, focusing technology on genuine human and ecological challenges.</p>
            </div>

            <div className="spark-rule-card">
              <div className="spark-rule-num">03</div>
              <h3 className="spark-rule-title">Log it.</h3>
              <p className="spark-rule-desc">What you asked, what you kept, what you changed. Good AI usage is evidence of inquiry, not cheating.</p>
            </div>

            <div className="spark-rule-card">
              <div className="spark-rule-num">04</div>
              <h3 className="spark-rule-title">Check it.</h3>
              <p className="spark-rule-desc">AI can be confidently wrong. Learners verify claims and model outputs with empirical data.</p>
            </div>

            <div className="spark-rule-card">
              <div className="spark-rule-num">05</div>
              <h3 className="spark-rule-title">Keep private things private.</h3>
              <p className="spark-rule-desc">No learner personal identifiers, location data, or private thoughts ever enter an AI prompt.</p>
            </div>
          </div>

          <div className="spark-code-chips">
            <span className="spark-code-chip">micro:bit MicroPython</span>
            <span className="spark-code-chip">Microsoft MakeCode</span>
            <span className="spark-code-chip">Python 3</span>
            <span className="spark-code-chip">Arduino C++</span>
            <span className="spark-code-chip">LEGO MINDSTORMS / SPIKE</span>
          </div>

          <div className="spark-device-frame" style={{ maxWidth: 960, marginTop: '3.5rem' }}>
            <div className="spark-device-notch" />
            <div className="spark-device-screen">
              <img
                src="/landing/pbl-studio.png"
                alt="SPARK PBL Studio with AI Co-Pilot"
                className="spark-device-img"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 7. SEVEN FUTURE SKILLS */}
      <section id="future-skills" className="spark-section">
        <div className="spark-section-container">
          <div className="spark-section-header">
            <span className="spark-section-tag">Competency Framework</span>
            <h2 className="spark-section-title">Seven skills that matter in a world full of AI.</h2>
            <p className="spark-section-desc">
              Each project phase is mapped to the competencies a coach looks for, so growth is visible, authentic, and never guessed.
            </p>
          </div>

          <div className="spark-skills-grid">
            {futureSkills.map((skill, index) => (
              <div
                key={index}
                className="spark-skill-card"
                onClick={() => setActiveSkillIndex(index)}
                style={{
                  cursor: 'pointer',
                  borderColor: activeSkillIndex === index ? 'var(--wl-purple)' : 'var(--wl-border)',
                  background: activeSkillIndex === index ? 'var(--wl-purple-light)' : '#ffffff'
                }}
              >
                <div className="spark-skill-icon">{skill.icon}</div>
                <h3 className="spark-skill-title">{skill.title}</h3>
                <p className="spark-skill-desc">{skill.def}</p>
              </div>
            ))}
          </div>

          <div className="spark-device-frame" style={{ maxWidth: 960, marginTop: '3rem' }}>
            <div className="spark-device-notch" />
            <div className="spark-device-screen">
              <img
                src="/landing/future-skills.png"
                alt="Seven Future Skills Interactive Milestone Rubrics"
                className="spark-device-img"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 8. BUILT FOR HOW YOUR CHILD THINKS */}
      <section id="wellbeing" className="spark-section spark-section-cloud">
        <div className="spark-section-container">
          <div className="spark-section-header">
            <span className="spark-section-tag">Wellbeing & Focus</span>
            <h2 className="spark-section-title">Calm by design.</h2>
            <p className="spark-section-desc">
              A neuro-inclusive digital space built to encourage deep thinking without sensory overload or comparison anxiety.
            </p>
          </div>

          <div className="spark-wellbeing-grid">
            <div className="spark-wellbeing-card">
              <div style={{ color: 'var(--wl-purple)', marginBottom: '0.75rem' }}><Award size={26} /></div>
              <h4>Progress without comparison</h4>
              <p>Shows what has been done, never how fast you are or how you compare with anyone else.</p>
            </div>

            <div className="spark-wellbeing-card">
              <div style={{ color: 'var(--wl-sky)', marginBottom: '0.75rem' }}><Heart size={26} /></div>
              <h4>Mindful daily check-in</h4>
              <p>Simple mood calibration: Energised, Steady, Not sure, or Stuck before starting project work.</p>
            </div>

            <div className="spark-wellbeing-card">
              <div style={{ color: 'var(--wl-purple)', marginBottom: '0.75rem' }}><Headphones size={26} /></div>
              <h4>Focus Sounds with no lyrics</h4>
              <p>Curated ambient soundscapes engineered without lyrics, because background words interfere with reading.</p>
            </div>

            <div className="spark-wellbeing-card">
              <div style={{ color: 'var(--wl-sky)', marginBottom: '0.75rem' }}><Zap size={26} /></div>
              <h4>Small daily goals</h4>
              <p>A gentle “Stuck, or not feeling this one?” button that offers achievable alternative steps forward.</p>
            </div>
          </div>

          <div className="spark-device-frame" style={{ maxWidth: 940 }}>
            <div className="spark-device-notch" />
            <div className="spark-device-screen">
              <img
                src="/landing/focus-space.png"
                alt="SPARK Creative Space and Focus Tools"
                className="spark-device-img"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 9. FOR PARENTS AND COACHES */}
      <section className="spark-section">
        <div className="spark-section-container">
          <div className="spark-section-header">
            <span className="spark-section-tag">Transparent Evidence</span>
            <h2 className="spark-section-title">See the learning, not just the grades.</h2>
            <p className="spark-section-desc">
              Coaches see each learner’s evidence, reflections and competency growth. Learners build a portfolio of their design journey that can travel with them to their next step, alongside a UK or US academic pathway.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            background: '#ffffff',
            borderRadius: '20px',
            padding: '2.5rem',
            border: '1px solid var(--wl-border)',
            boxShadow: '0 10px 30px rgba(20, 33, 58, 0.04)',
            marginBottom: '3rem'
          }}>
            <div>
              <h3 style={{ fontSize: '1.35rem', marginBottom: '0.75rem' }}>Parent Visibility</h3>
              <p style={{ color: 'var(--wl-navy-subtle)', lineHeight: 1.6, fontSize: '0.95rem' }}>
                Open any project milestone to inspect the genuine artifacts created by your child: 3D CAD files, robot schematics, field notes, and reflective videos. No mystery report cards.
              </p>
            </div>
            <div>
              <h3 style={{ fontSize: '1.35rem', marginBottom: '0.75rem' }}>Mentorship That Counts</h3>
              <p style={{ color: 'var(--wl-navy-subtle)', lineHeight: 1.6, fontSize: '0.95rem' }}>
                Coaches provide formative Socratic feedback directly on project evidence. They validate competency achievements that translate into university admissions credits worldwide.
              </p>
            </div>
          </div>

          <div className="spark-device-frame" style={{ maxWidth: 960 }}>
            <div className="spark-device-notch" />
            <div className="spark-device-screen">
              <img
                src="/landing/coach-dashboard.png"
                alt="WeLearn SPARK Coach Mentorship Hub and Progress Tracking"
                className="spark-device-img"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 10. FAQ + FINAL CTA */}
      <section id="faq" className="spark-section spark-section-cloud">
        <div className="spark-section-container">
          <div className="spark-section-header">
            <span className="spark-section-tag">Frequently Asked Questions</span>
            <h2 className="spark-section-title">Common questions from families.</h2>
          </div>

          <div className="spark-faq-list">
            {faqs.map((faq, index) => (
              <div key={index} className="spark-faq-item">
                <button
                  type="button"
                  className="spark-faq-question"
                  onClick={() => toggleFaq(index)}
                  aria-expanded={openFaqIndex === index}
                >
                  <span>{faq.q}</span>
                  {openFaqIndex === index ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                {openFaqIndex === index && (
                  <div className="spark-faq-answer">
                    <p style={{ margin: 0 }}>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Final CTA Box */}
          <div className="spark-final-cta">
            <h2>Curious what your child could build?</h2>
            <p>
              Schedule a Discovery Call with our learning centre team to tour SPARK and see how personalized project inquiry works.
            </p>
            <button
              type="button"
              className="spark-btn-lime"
              onClick={() => setContactOpen(true)}
              style={{ fontSize: '1.1rem', padding: '0.9rem 2.2rem' }}
            >
              Book a Discovery Call
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="spark-footer">
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <strong>WeLearn SPARK</strong> · Learning Centre Bangkok
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <span>Ages 11–18</span>
            <span>Mastery Transcript Consortium</span>
            <span>UK & US Pathways</span>
          </div>
          <div>© {new Date().getFullYear()} WeLearn Academy. All rights reserved.</div>
        </div>
      </footer>

      {/* Contact / Discovery Call Modal */}
      <ContactAdminModal isOpen={contactOpen} onClose={() => setContactOpen(false)} />
    </div>
  );
}
