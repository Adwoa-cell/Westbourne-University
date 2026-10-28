import { Router } from 'express';
import { asyncHandler as wrap } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { contactLimiter } from '../middleware/rateLimiters.js';
import { announcementQuery, contactBody, cutoffQuery, programmeQuery } from '../validation/schemas.js';
import * as c from '../controllers/publicController.js';

const router = Router();

router.get('/faculties', wrap(c.listFaculties));
router.get('/programmes', validate(programmeQuery), wrap(c.listProgrammes));
router.get('/cutoff-points', validate(cutoffQuery), wrap(c.listCutoffPoints));
router.get('/announcements', validate(announcementQuery), wrap(c.listAnnouncements));
router.get('/events', wrap(c.listEvents));
router.get('/admissions/info', wrap(c.getAdmissionsInfo));
router.post('/contact', contactLimiter, validate(contactBody, 'body'), wrap(c.submitContact));

export default router;
