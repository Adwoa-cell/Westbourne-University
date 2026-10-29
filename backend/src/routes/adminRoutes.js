
import { Router } from 'express';
import { asyncHandler as wrap } from '../middleware/asyncHandler.js';
import { requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

import {
  adminUsersQuery,
  setRoleBody,
  userIdParams,
  createProgrammeBody,
  updateProgrammeBody,
  programmeIdParams,
  programmeStatusBody,
  applicationQuery,
  applicationIdParams,
  applicationStatusBody,
  studentQuery,
  studentIdParams,
  createCalendarEventBody,
  updateCalendarEventBody,
  calendarEventIdParams,
} from '../validation/schemas.js';

import * as c from '../controllers/adminController.js';

// Everything under /api/v1/admin requires authentication
// and the administrator role.
export const createAdminRoutes = (authenticate) => {
  const router = Router();

  router.use(authenticate, requireRole('administrator'));

  // User Management
  router.get(
    '/users',
    validate(adminUsersQuery),
    wrap(c.listUsers),
  );

  router.patch(
    '/users/:id/role',
    validate(userIdParams, 'params'),
    validate(setRoleBody, 'body'),
    wrap(c.setUserRole),
  );

  // Programmes Management
  router.get(
    '/programmes',
    wrap(c.listAdminProgrammes),
  );

  router.post(
    '/programmes',
    validate(createProgrammeBody, 'body'),
    wrap(c.createProgramme),
  );

  router.patch(
    '/programmes/:id',
    validate(programmeIdParams, 'params'),
    validate(updateProgrammeBody, 'body'),
    wrap(c.updateProgramme),
  );

  router.patch(
    '/programmes/:id/status',
    validate(programmeIdParams, 'params'),
    validate(programmeStatusBody, 'body'),
    wrap(c.updateProgrammeStatus),
  );

  router.get('/faculties', wrap(c.listAdminFaculties));

  router.get(
    '/applications',
    validate(applicationQuery),
    wrap(c.listAdminApplications),
  );
  router.get(
    '/applications/:id',
    validate(applicationIdParams, 'params'),
    wrap(c.getAdminApplication),
  );
  router.patch(
    '/applications/:id/status',
    validate(applicationIdParams, 'params'),
    validate(applicationStatusBody, 'body'),
    wrap(c.updateAdminApplicationStatus),
  );

  router.get(
    '/students',
    validate(studentQuery),
    wrap(c.listAdminStudents),
  );
  router.get(
    '/students/:id',
    validate(studentIdParams, 'params'),
    wrap(c.getAdminStudent),
  );

  router.get('/calendar-events', wrap(c.listAdminCalendarEvents));
  router.post(
    '/calendar-events',
    validate(createCalendarEventBody, 'body'),
    wrap(c.createCalendarEvent),
  );
  router.patch(
    '/calendar-events/:id',
    validate(calendarEventIdParams, 'params'),
    validate(updateCalendarEventBody, 'body'),
    wrap(c.updateCalendarEvent),
  );

  return router;
};
