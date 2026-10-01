import Router from "express";
import handleGetEmails from "../controllers/handleGetEmails.js";
const router = Router();

router.get('/emails/:userId',handleGetEmails);

export default router;