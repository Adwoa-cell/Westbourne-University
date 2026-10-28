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
