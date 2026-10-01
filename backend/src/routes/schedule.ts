import Router from "express";
import handleScheduleEmail from "../controllers/scheduleEmail.js";

const router = Router();

router.post('/schedule', handleScheduleEmail);
export default router;