import express from 'express'
const router = express.Router()

import loginController from '../app/controllers/LoginController.js'

router.get('/', loginController.show)
router.post('/', loginController.post_login)

export default router;
