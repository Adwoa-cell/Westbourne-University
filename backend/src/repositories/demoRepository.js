import { academicYear, admissionsInfo, announcements, cutoffPoints, events, faculties, programmes } from '../data/demoData.js';
import { saveContactMessage } from '../services/contactStore.js';

// Repository contract shared with supabaseRepository.js. Controllers only talk to this interface.
export const demoRepository = {
  async faculties() {
    return faculties;
  },
  async programmes() {
    return programmes;
  },
  async cutoffPoints(year) {
    const label = year ?? academicYear;
    const rows = cutoffPoints
      .filter((c) => c.academicYear === label)
      .map((c) => {
        const p = programmes.find((item) => item.code === c.programmeCode);
        return {
          programmeCode: c.programmeCode,
          programmeName: p.name,
          facultyId: p.facultyId,
          qualification: p.qualification,
          points: c.points,
          requiredSubjects: c.requiredSubjects,
          additional: c.additional,
        };
      });
    return { academicYear: label, rows };
  },
  async announcements() {
    return announcements;
  },
  async events() {
    return events;
  },
  async admissionsInfo() {
    return admissionsInfo;
  },
  async saveContact(message) {
    await saveContactMessage(message);
  },
};
