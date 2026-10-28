import { Router } from 'express';
import { asyncHandler as wrap } from '../middleware/asyncHandler.js';
import { requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { adminUsersQuery, setRoleBody, userIdParams } from '../validation/schemas.js';
import * as c from '../controllers/adminController.js';

// Everything under /api/v1/admin requires a verified session AND the administrator role.
export const createAdminRoutes = (authenticate) => {
  const router = Router();
  router.use(authenticate, requireRole('administrator'));
  router.get('/users', validate(adminUsersQuery), wrap(c.listUsers));
  router.patch('/users/:id/role', validate(userIdParams, 'params'), validate(setRoleBody, 'body'), wrap(c.setUserRole));
  return router;
};
