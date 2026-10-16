import express from 'express';
import { getPages, getFlows, getPolicies, getPlatformKnowledge } from '../controllers/platformController';

const router = express.Router();

router.get('/pages', getPages);
router.get('/flows', getFlows);
router.get('/policies', getPolicies);
router.get('/knowledge', getPlatformKnowledge);

export default router;
