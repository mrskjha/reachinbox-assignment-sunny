import Router from "express";
import handleElasticsearch from "../controllers/search.js";

const router = Router();
router.get('/search', handleElasticsearch);
export default router;