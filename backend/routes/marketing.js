import { Router } from 'express';
import {
    getMarketingProjects,
    createMarketingProject,
    getMarketingProjectById,
    updateMarketingProject,
    deleteMarketingProject
} from '../controllers/marketingController.js';

const router = Router();

router.route('/')
    .get(getMarketingProjects)
    .post(createMarketingProject);

router.route('/:id')
    .get(getMarketingProjectById)
    .put(updateMarketingProject)
    .delete(deleteMarketingProject);

export default router;
