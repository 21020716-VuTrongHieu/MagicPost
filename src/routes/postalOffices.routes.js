import express from 'express';
const router = express.Router();
import PostalOfficeController from "../app/controllers/PostalOfficeController.js";

router.get('/', PostalOfficeController.getPostalOffice);
export default router;