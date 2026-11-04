import { hrefFor } from '../../app/routes.js';
import { programById } from '../pbl/content/programCatalogue.js';
import { schoolPath, useSchoolResource } from '../school/useSchoolWorkspace.js';

export function ClassCourses({ uid, query = '' }) {
  return uid ? <ClassCoursesForLearner key={uid} query={query} /> : null;
}

function ClassCoursesForLearner({ query }) {
  const { data, error } = useSchoolResource('/api/learning-context');
  if (error || data?.role !== 'student') return null;
  return data.schools.filter(school => data.classes.some(cls => cls.schoolId === school.id)).map(school => (
    <SchoolClassCourses key={school.id} school={school} query={query} />
  ));
}

function SchoolClassCourses({ school, query }) {
  const { data, error } = useSchoolResource(schoolPath(school.id, 'program-offerings'));
  if (error) return null;
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const courses = (data?.items || []).flatMap(offering => {
    if (offering.status !== 'published') return [];
    const program = offering.programDefinition || programById(offering.programId);
    if (!program) return [];
    const text = [program.title, program.overview, program.drivingQuestion].join(' ').toLowerCase();
    return words.every(word => text.includes(word)) ? [{ offering, program }] : [];
  });
  if (!courses.length) return null;
  return (
    <section className="gh-page" aria-label={`Class courses at ${school.name}`}>
      <h2>Class courses · {school.name}</h2>
      <ul className="gh-course-grid">
        {courses.map(({ offering, program }) => (
          <li key={offering.id} className="mc-card">
            <a className="gh-course" href={hrefFor.programs(school.id, offering.programId, offering.id)}>
              <span className="gh-course-kicker">{offering.yearId} · Semester {offering.semester}</span>
              <span className="gh-course-title">{program.title}</span>
              <span className="gh-course-desc">{program.drivingQuestion}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
