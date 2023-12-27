import express from 'express'
const router = express.Router()
import TransactionManagerController from '../app/controllers/TransactionsManagerController.js';

router.get('/hoadon/:code_tracking', TransactionManagerController.show_hoa_don)
router.post('/tao_don_hang', TransactionManagerController.tao_don_hang)
router.get('/tra_cuu_don', TransactionManagerController.tra_cuu_don)
router.get('/danh_sach_don', TransactionManagerController.danh_sach_don)
router.post('/danh_sach_don', TransactionManagerController.post_danh_sach_don)
// router.get('/tao_tui', TransactionManagerController.tao_tui_hang)
router.post('/tui_hang', TransactionManagerController.tui_hang)
router.post('/tao_tui_hang', TransactionManagerController.tao_tui_hang)
router.get('/danh_sach_tui_di', TransactionManagerController.danh_sach_tui_di)
router.post('/danh_sach_tui_di', TransactionManagerController.post_danh_sach_tui_di)
router.get('/danh_sach_tui_nhan', TransactionManagerController.danh_sach_tui_nhan)
router.post('/danh_sach_tui_nhan', TransactionManagerController.post_danh_sach_tui_nhan)
router.post('/xac_nhan_tui_den', TransactionManagerController.xac_nhan_tui_den)
router.get('/thong_tin_tui_hang/:code_tracking', TransactionManagerController.thong_tin_tui)
router.get('/xac_nhan_chi_tiet_tui/:code_tracking', TransactionManagerController.xac_nhan_chi_tiet_tui)
router.post('/xac_nhan_item', TransactionManagerController.xac_nhan_item)
router.post('/cap_nhap_trang_thai', TransactionManagerController.cap_nhap_trang_thai)
router.get('/danh_sach_giao_thanh_cong', TransactionManagerController.show_giao_thanh_cong)
router.post('/danh_sach_giao_thanh_cong', TransactionManagerController.giao_thanh_cong)
router.get('/danh_sach_giao_that_bai', TransactionManagerController.show_giao_that_bai)
router.post('/danh_sach_giao_that_bai', TransactionManagerController.giao_that_bai)
router.get('/danh_sach_nhan_vien',TransactionManagerController.showList)
router.get('/', TransactionManagerController.show)

export default router;