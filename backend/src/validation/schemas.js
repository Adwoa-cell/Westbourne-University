import { z } from 'zod';

const text = (min, max) => z.string().trim().min(min).max(max);

export const programmeQuery = z.object({
  q: z.string().trim().max(80).optional(),
  faculty: z.string().trim().max(20).optional(),
  qualification: z.enum(['Certificate', 'Diploma', 'Bachelor', 'Master']).optional(),
  studyMode: z.string().trim().max(40).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export const cutoffQuery = z.object({
  q: z.string().trim().max(80).optional(),
  academicYear: z.string().trim().max(9).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export const announcementQuery = z.object({
  category: z.enum(['Admissions', 'Academic calendar', 'General']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

export const contactBody = z.object({
  name: text(2, 100),
  email: z.string().trim().toLowerCase().email().max(254),
  subject: text(3, 150),
  message: text(10, 2000),
  // Honeypot: real users never see or fill this field. Bots often do.
  website: z.string().max(200).optional().default(''),
});

const roles = ['applicant', 'student', 'admissions_officer', 'lecturer', 'administrator'];

// .strict() rejects unknown keys, so a client can never smuggle in { role: 'administrator' } here.
export const updateMeBody = z
  .object({
    fullName: text(1, 120).optional(),
    phone: z.string().trim().min(5).max(30).nullable().optional(),
  })
  .strict()
  .refine((v) => v.fullName !== undefined || v.phone !== undefined, { message: 'Provide fullName or phone.' });

export const adminUsersQuery = z.object({
  q: z.string().trim().max(80).optional(),
  role: z.enum(roles).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export const userIdParams = z.object({ id: z.string().uuid() });
export const setRoleBody = z.object({ role: z.enum(roles) }).strict();

const programmeFields = {
  code: z.string().trim().regex(/^[A-Z0-9-]{3,20}$/, 'Use 3–20 uppercase letters, numbers or hyphens.'),
  name: text(1, 200),
  facultyId: z.string().uuid(),
  qualification: z.enum(['Certificate', 'Diploma', 'Bachelor', 'Master']),
  durationMonths: z.coerce.number().int().min(1).max(120),
  studyMode: text(1, 100),
  description: z.string().trim().max(5000),
  entryRequirements: z.string().trim().max(5000),
  isFeatured: z.boolean(),
  isActive: z.boolean(),
};

export const createProgrammeBody = z.object(programmeFields).strict();

export const updateProgrammeBody = z
  .object(programmeFields)
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one programme field to update.',
  });

export const programmeIdParams = z.object({
  id: z.string().uuid(),
});

export const programmeStatusBody = z.object({
  isActive: z.boolean(),
}).strict();

export const applicationQuery = z.object({
  status: z.enum(['draft', 'submitted', 'under_review', 'additional_information_required', 'accepted', 'rejected']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export const applicationIdParams = z.object({ id: z.string().uuid() });

export const applicationStatusBody = z.object({
  status: z.enum(['under_review', 'additional_information_required', 'accepted', 'rejected']),
  infoRequest: z.string().trim().max(2000).optional(),
}).strict().refine(
  (value) => value.status !== 'additional_information_required' || Boolean(value.infoRequest),
  { message: 'Explain what additional information is required.', path: ['infoRequest'] },
);

export const studentQuery = z.object({
  q: z.string().trim().max(80).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export const studentIdParams = z.object({ id: z.string().uuid() });

const eventTypes = ['semester', 'registration', 'examination', 'holiday', 'event', 'deadline'];
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}, 'Enter a valid calendar date.');

const calendarEventFields = {
  title: text(3, 200),
  description: z.string().trim().max(4000).default(''),
  location: z.string().trim().max(200).default(''),
  eventType: z.enum(eventTypes),
  startsOn: isoDate,
  endsOn: isoDate.nullable().optional(),
  academicYearId: z.string().uuid().nullable().optional(),
  semesterId: z.string().uuid().nullable().optional(),
  isPublic: z.boolean().default(true),
};

const eventDateRange = (value) => !value.endsOn || !value.startsOn || value.endsOn >= value.startsOn;

export const createCalendarEventBody = z.object(calendarEventFields).strict().refine(eventDateRange, {
  message: 'The end date must be on or after the start date.',
  path: ['endsOn'],
});

export const updateCalendarEventBody = z.object({
  ...calendarEventFields,
  description: z.string().trim().max(4000).optional(),
  location: z.string().trim().max(200).optional(),
  isPublic: z.boolean().optional(),
}).partial().strict().refine((value) => Object.keys(value).length > 0, {
  message: 'Provide at least one event field to update.',
}).refine(eventDateRange, {
  message: 'The end date must be on or after the start date.',
  path: ['endsOn'],
});

export const calendarEventIdParams = z.object({ id: z.string().uuid() });
