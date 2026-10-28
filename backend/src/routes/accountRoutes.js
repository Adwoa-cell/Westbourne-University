import { Router } from 'express';
import { asyncHandler as wrap } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { updateMeBody } from '../validation/schemas.js';
import * as c from '../controllers/accountController.js';

export const createAccountRoutes = (authenticate) => {
  const router = Router();
  router.get('/me', authenticate, c.getMe);
  router.patch('/me', authenticate, validate(updateMeBody, 'body'), wrap(c.updateMe));
  return router;
};
