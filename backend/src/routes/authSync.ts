import Router from "express";
import  handleAuthSync, { handlewebHookSync } from "../controllers/authSync.js";

const router = Router();

router.post('/auth/sync', handleAuthSync);
router.post('/users/:userId/slack',handlewebHookSync );

export default router;