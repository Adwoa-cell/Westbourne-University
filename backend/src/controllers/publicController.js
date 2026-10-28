import { repository } from '../repositories/index.js';
import { paginate } from '../services/paginate.js';

const matches = (haystack, needle) => haystack.toLowerCase().includes(needle.toLowerCase());
const byNewest = (a, b) => b.date.localeCompare(a.date);

export const listFaculties = async (req, res) => {
  res.json({ data: await repository.faculties() });
};

export const listProgrammes = async (req, res) => {
  const { q, faculty, qualification, studyMode, page, pageSize } = req.validated.query;
  const all = await repository.programmes();
  const filtered = all.filter(
    (p) =>
      (!q || matches(p.name, q) || matches(p.code, q) || matches(p.description, q)) &&
      (!faculty || p.facultyId === faculty) &&
      (!qualification || p.qualification === qualification) &&
      (!studyMode || matches(p.studyMode, studyMode)),
  );
  res.json(paginate(filtered, page, pageSize));
};

export const listCutoffPoints = async (req, res) => {
  const { q, academicYear, page, pageSize } = req.validated.query;
  const result = await repository.cutoffPoints(academicYear);
  const rows = result.rows.filter(
    (row) => !q || matches(row.programmeName, q) || matches(row.programmeCode, q) || row.requiredSubjects.some((s) => matches(s, q)),
  );
  res.json({ ...paginate(rows, page, pageSize), academicYear: result.academicYear });
};

export const listAnnouncements = async (req, res) => {
  const { category, page, pageSize } = req.validated.query;
  const rows = (await repository.announcements()).filter((a) => !category || a.category === category).sort(byNewest);
  res.json(paginate(rows, page, pageSize));
};

export const listEvents = async (req, res) => {
  const rows = [...(await repository.events())].sort((a, b) => a.date.localeCompare(b.date));
  res.json({ data: rows });
};

export const getAdmissionsInfo = async (req, res) => {
  res.json({ data: await repository.admissionsInfo() });
};

export const submitContact = async (req, res) => {
  const { website, ...message } = req.validated.body;
  // Honeypot filled in: pretend success so bots learn nothing, but store nothing.
  if (!website) await repository.saveContact(message);
  res.status(201).json({ data: { received: true } });
};
