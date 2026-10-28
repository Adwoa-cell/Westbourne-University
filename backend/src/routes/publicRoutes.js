import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { contactLimiter } from '../middleware/rateLimiters.js';
import { announcementQuery, contactBody, cutoffQuery, programmeQuery } from '../validation/schemas.js';
import * as c from '../controllers/publicController.js';

const router = Router();

router.get('/faculties', c.listFaculties);
router.get('/programmes', validate(programmeQuery), c.listProgrammes);
router.get('/cutoff-points', validate(cutoffQuery), c.listCutoffPoints);
router.get('/announcements', validate(announcementQuery), c.listAnnouncements);
router.get('/events', c.listEvents);
router.get('/admissions/info', c.getAdmissionsInfo);
router.post('/contact', contactLimiter, validate(contactBody, 'body'), c.submitContact);

export default router;
