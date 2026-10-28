import { academicYear, admissionsInfo, announcements, cutoffPoints, events, faculties, programmes } from '../data/demoData.js';
import { paginate } from '../services/paginate.js';
import { saveContactMessage } from '../services/contactStore.js';

const matches = (haystack, needle) => haystack.toLowerCase().includes(needle.toLowerCase());
const byNewest = (a, b) => b.date.localeCompare(a.date);

export const listFaculties = (req, res) => {
  res.json({ data: faculties });
};

export const listProgrammes = (req, res) => {
  const { q, faculty, qualification, studyMode, page, pageSize } = req.validated.query;
  const filtered = programmes.filter(
    (p) =>
      (!q || matches(p.name, q) || matches(p.code, q) || matches(p.description, q)) &&
      (!faculty || p.facultyId === faculty) &&
      (!qualification || p.qualification === qualification) &&
      (!studyMode || matches(p.studyMode, studyMode)),
  );
  res.json(paginate(filtered, page, pageSize));
};

export const listCutoffPoints = (req, res) => {
  const { q, academicYear: year = academicYear, page, pageSize } = req.validated.query;
  const rows = cutoffPoints
    .filter((c) => c.academicYear === year)
    .map((c) => {
      const programme = programmes.find((p) => p.code === c.programmeCode);
      return { ...c, programmeName: programme.name, facultyId: programme.facultyId, qualification: programme.qualification };
    })
    .filter((row) => !q || matches(row.programmeName, q) || matches(row.programmeCode, q) || row.requiredSubjects.some((s) => matches(s, q)));
  res.json({ ...paginate(rows, page, pageSize), academicYear: year });
};

export const listAnnouncements = (req, res) => {
  const { category, page, pageSize } = req.validated.query;
  const rows = announcements.filter((a) => !category || a.category === category).sort(byNewest);
  res.json(paginate(rows, page, pageSize));
};

export const listEvents = (req, res) => {
  res.json({ data: [...events].sort((a, b) => a.date.localeCompare(b.date)) });
};

export const getAdmissionsInfo = (req, res) => {
  res.json({ data: admissionsInfo });
};

export const submitContact = async (req, res, next) => {
  try {
    const { website, ...message } = req.validated.body;
    // Honeypot filled in: pretend success so bots learn nothing, but store nothing.
    if (website) return res.status(201).json({ data: { received: true } });
    await saveContactMessage(message);
    return res.status(201).json({ data: { received: true } });
  } catch (err) {
    return next(err);
  }
};
