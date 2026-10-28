import { admissionsInfo } from '../data/demoData.js';
import { getAdminClient, getPublicClient } from '../config/supabase.js';

// Same interface as demoRepository.js, backed by PostgreSQL. Reads use the ANON role,
// so Row Level Security alone decides what the public may see.
const check = ({ data, error }) => {
  if (error) throw new Error(`Database error: ${error.message}`);
  return data;
};

const formatDuration = (months) => {
  if (months % 12 === 0) {
    const years = months / 12;
    return `${years} year${years === 1 ? '' : 's'}`;
  }
  return `${months} months`;
};

async function currentYearLabel() {
  const rows = check(await getPublicClient().from('academic_years').select('label').eq('is_current', true).limit(1));
  return rows[0]?.label ?? admissionsInfo.academicYear;
}

export const supabaseRepository = {
  async faculties() {
    const rows = check(await getPublicClient().from('faculties').select('code,name,summary,departments').order('name'));
    return rows.map((f) => ({ id: f.code, name: f.name, summary: f.summary, departments: f.departments }));
  },

  async programmes() {
    const rows = check(
      await getPublicClient()
        .from('programmes')
        .select('code,name,qualification,duration_months,study_mode,description,entry_requirements,is_featured,faculties(code)')
        .eq('is_active', true)
        .order('name'),
    );
    return rows.map((p) => ({
      code: p.code,
      name: p.name,
      facultyId: p.faculties.code,
      qualification: p.qualification,
      duration: formatDuration(p.duration_months),
      studyMode: p.study_mode,
      description: p.description,
      entryRequirements: p.entry_requirements,
      featured: p.is_featured,
    }));
  },

  async cutoffPoints(year) {
    const label = year ?? (await currentYearLabel());
    const rows = check(
      await getPublicClient()
        .from('cutoff_points')
        .select('points,required_subjects,additional_requirements,programmes(code,name,qualification,faculties(code)),academic_years!inner(label)')
        .eq('academic_years.label', label),
    );
    return {
      academicYear: label,
      rows: rows
        .map((c) => ({
          programmeCode: c.programmes.code,
          programmeName: c.programmes.name,
          facultyId: c.programmes.faculties.code,
          qualification: c.programmes.qualification,
          points: c.points,
          requiredSubjects: c.required_subjects,
          additional: c.additional_requirements,
        }))
        .sort((a, b) => a.programmeName.localeCompare(b.programmeName)),
    };
  },

  async announcements() {
    const rows = check(
      await getPublicClient()
        .from('announcements')
        .select('id,title,body,category,published_at')
        .order('published_at', { ascending: false })
        .limit(200),
    );
    return rows.map((a) => ({ id: a.id, category: a.category, title: a.title, date: (a.published_at ?? '').slice(0, 10), summary: a.body }));
  },

  async events() {
    const today = new Date().toISOString().slice(0, 10);
    const rows = check(
      await getPublicClient()
        .from('calendar_events')
        .select('id,title,description,location,starts_on')
        .in('event_type', ['event', 'deadline'])
        .gte('starts_on', today)
        .order('starts_on'),
    );
    return rows.map((e) => ({ id: e.id, title: e.title, date: e.starts_on, location: e.location, summary: e.description }));
  },

  // Requirements, steps, deadlines and FAQs are still static content; they move to the database with the admin dashboard.
  async admissionsInfo() {
    return { ...admissionsInfo, academicYear: await currentYearLabel() };
  },

  async saveContact(message) {
    check(await getAdminClient().from('contact_messages').insert(message));
  },
};
