import express from 'express'
const router = express.Router()
import ManagerController from '../app/controllers/ManagerController.js';

router.get('/tra_cuu_don', ManagerController.tra_cuu_don)
router.get('/danh_sach_nhan_vien',ManagerController.showList)
router.post('/danh_sach_nhan_vien/them_nhan_vien',ManagerController.addEmployee)
router.get('/danh_sach_nhan_vien/thong_tin_tai_khoan/:id',ManagerController.getAccount)
router.post('/danh_sach_nhan_vien/sua_tai_khoan/:id',ManagerController.editEmployee)
router.delete('/danh_sach_nhan_vien/xoa_tai_khoan', ManagerController.deleteAccount)
router.get('/getPostalOffice', ManagerController.getPostalOffice)
router.get('/', ManagerController.showList)

export default router;
