import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;

import Parcels from "../models/Parcels.js";
import Postal_office from "../models/Postal_office.js";
import Parcel_bags from "../models/Parcel_bags.js";

const warehouse_staff_header = true;

class Warehouse_staffController {
    show(req, res, next) {
        var postal_office_code = new ObjectId(req.user_data.postal_office_code);
        console.log(postal_office_code)
        function findProductList () {
             return Parcels.aggregate([
                        {
                            $addFields: {
                                lastObject : {
                                    $arrayElemAt: ["$trang_thai", -1]
                                }
                            }
                        },
                        {
                            $match: {
                                $and: [
                                    { "lastObject.postal_office_code" :  postal_office_code,  },
                                    {
                                        $or : [
                                            {"lastObject.trang_thai" : {$nin: ['Đã giao hàng', 'Thất lạc']}},
                                            
                                        ]
                                    }
                                ]  
                            }
                        }
                    ]).exec()
        }
        findProductList()
        .then(data => {
            console.log(data)
            var checkProduct = false;
            if(data.length != 0) {
                checkProduct = true;
                var number_format = function(number) {
                    if(number.toString().length < 2){
                        return `0${number.toString()}`;
                    } else {
                        return number;
                    }
                }
                for(var i = 0; i< data.length; i++) {
                    // data[i] = data[i].toObject();
                    var time = data[i].trang_thai[0].time;
                    var ngay = `${number_format(time.getDate())}/${number_format(time.getMonth() + 1)}/${time.getFullYear()}`;
                    var gio = `${number_format(time.getHours())}:${number_format(time.getMinutes())}:${number_format(time.getSeconds())}`;

                    
                    var trang_thai_hien_tai = data[i].trang_thai[data[i].trang_thai.length-1].trang_thai;
        
                    data[i].ngay_tao_don = ngay;
                    data[i].gio_tao = gio;
                    data[i].trang_thai_hien_tai = trang_thai_hien_tai;
                    data[i].ma_buu_cuc_giao_dich = data[i].send_postal_code;
                    data[i].ten_buu_cuc = data[i].trang_thai[0].vi_tri;
                    data[i].ten_nguoi_gui = data[i].send_name;
                    var check_ = true;
                    if(trang_thai_hien_tai != "Đang chờ chuyển đi" && trang_thai_hien_tai != "Đã đến bưu cục") {
                        check_ = false;
                    }
                    data[i].check_ = check_;
                     
                }
                res.render('./warehouse_staff_view/danh_sach_don', {checkProduct, data, warehouse_staff_header})
            } else {
                res.render('./warehouse_staff_view/danh_sach_don', {checkProduct, warehouse_staff_header})
            }
        })
        .catch(err => {
            console.log(err)
        })
        
    }

    cap_nhap_trang_thai(req, res, next) {
        var code_tracking = req.body.code_tracking;
        var trang_thai_moi = req.body.trang_thai_moi;
        var postal_office_code = req.user_data.postal_office_code;
        var postal_office_code_ = new ObjectId(postal_office_code);
        

        Postal_office.findById(new ObjectId(postal_office_code))
        .then(postal => {
            if(postal) {
                var vi_tri = postal.name;

                Parcels.updateOne(
                    {_id: new ObjectId(code_tracking)},
                    {$push: {
                        "trang_thai": {
                            trang_thai: trang_thai_moi,
                            time: Date.now(),
                            vi_tri: vi_tri,
                            postal_office_code: postal_office_code_,
        
                        }
                    }}
                )
                .then(res_ => {
                    if(res_) {
                        res.json({
                            message: true,
                        })
                    }else {
                        res.json({
                            message: false,
                        })
                    }
                })
            }
        })
        .catch(err => {
            console.log(err);
            res.json({
                message: false,
            })
        })

        
    }

    tui_hang(req, res, next) {

        var postal_office_code = req.user_data.postal_office_code;
        var product_id_list = JSON.parse(req.body.product_id_list);
        product_id_list = Array.from(product_id_list);
        product_id_list = product_id_list.map(product => {
            return new ObjectId(product.product_id);
        })

        const getProduct_list = (product_id_list) => {
            const promises = product_id_list.map( product_id => {
                return Parcels.findById(product_id)
            })
            return Promise.all(promises)
        }

        var number_format = function(number) {
            if(number.toString().length < 2){
                return `0${number.toString()}`;
            } else {
                return number;
            }
        }  

        getProduct_list(product_id_list)
        .then(data => {
            if(data.length != 0) {
                for(var i =0; i < data.length; i++) {
                    data[i] = data[i].toObject()
                    var time = data[i].trang_thai[0].time;
                    var ngay = `${number_format(time.getDate())}/${number_format(time.getMonth() + 1)}/${time.getFullYear()}`;
                    var gio = `${number_format(time.getHours())}:${number_format(time.getMinutes())}:${number_format(time.getSeconds())}`;
                    

                    data[i].ngay_tao = ngay;
                    data[i].gio_tao = gio;
                    data[i].trang_thai_hien_tai = data[i].trang_thai[data[i].trang_thai.length - 1].trang_thai;    
                }

                Postal_office.findById(new ObjectId(postal_office_code))
                .then(data2 => {
                    if(data2) {
                        data2 = data2.toObject();
                        res.render('./warehouse_staff_view/tao_tui_hang', {data2,  data,warehouse_staff_header})
                    }
                })
                .catch(err => {
                    console.log(err)
                    res.status(500).send("Loi SV");
                })
                
            } else {
                res.status(500).send("Loi server")
            }

        })
        .catch(err => {
            res.status(500).send("Loi server!!!")
        })
    }

    tao_tui_hang(req, res, next) {
        var receives_postal_office = req.body.receives_postal_office;
        var product_id_list = req.body.product_id_list;
        var send_postal_office = req.user_data.postal_office_code;
        var product_list = product_id_list.map(product_id => {
            return {
                product_id: product_id,
                check: false,
            }
        })
        Postal_office.findById(new ObjectId(send_postal_office))
        .then(data => {
            if(data) {
                var vi_tri_ = data.name;
                var new_parcel_bag = {
                    send_postal_office: send_postal_office,
                    receives_postal_office: receives_postal_office,
                    time: Date.now(),
                    product_list : product_list,
                    trang_thai: [{
                        trang_thai: "Đã rời khỏi bưu cục",
                        time: Date.now(),
                        vi_tri: vi_tri_,
                        postal_office_code: send_postal_office
                    }]
                }

                Parcel_bags.create(new_parcel_bag)
                .then(data => {
                    if(data) {

                        var promises = product_id_list.map(product_id => {
                            Parcels.updateOne(
                                {_id: new ObjectId(product_id)},
                                {$push: {
                                    "trang_thai" : {
                                        trang_thai: "Đã rời bưu cục",
                                        time: Date.now(),
                                        vi_tri: vi_tri_,
                                        postal_office_code: send_postal_office
                                    }
                                }}
                            ).then(data => {
                                console.log(data)
                                return true;
                            })
                        })

                        Promise.all(promises)
                        .then(data => {
                            res.json({
                                message: true
                            })
                        })
                    } else {
                        res.json({
                            message: false
                        })
                    }
                })
                .catch(err => {
                    res.json({
                        message: false
                    })
                })
            }     
        })
    }

    danh_sach_tui_di(req, res, next) {
        res.render('./warehouse_staff_view/danh_sach_tui_di', {warehouse_staff_header})
    }
    post_danh_sach_tui_di(req, res, next) {
        var tu_ngay = req.body.tu_ngay;
        var den_ngay = req.body.den_ngay;
        var postal_office_code = req.user_data.postal_office_code;
        console.log(tu_ngay, den_ngay, postal_office_code);

        var [day, month, year] = tu_ngay.split('/');
        const startTime = new Date(`${year}/${month}/${day}`);
        var [day, month, year] = den_ngay.split('/');
        const endTime = new Date(`${year}/${month}/${parseInt(day)+1}`);
        console.log(startTime, endTime)
        function findBagList() {
            return Parcel_bags.aggregate([
                {
                    $addFields: {
                        firstObject: {
                            $arrayElemAt: ["$trang_thai", 0]
                        }
                    }
                },
                {
                    $match: {
                        "firstObject.postal_office_code" : new ObjectId(postal_office_code),
                        "firstObject.time": {$gte: startTime, $lte: endTime}
                    }
                }
            ]).exec()
        }

        findBagList()
        .then(data => {
            console.log(data.length)
            var checkBag = false;
            if(data.length != 0) {
                checkBag = true;
                var number_format = function(number) {
                    if(number.toString().length < 2){
                        return `0${number.toString()}`;
                    } else {
                        return number;
                    }
                }
                for(var i = 0; i< data.length; i++) {
                    // data[i] = data[i].toObject();
                    var time = data[i].trang_thai[0].time;
                    var ngay = `${number_format(time.getDate())}/${number_format(time.getMonth() + 1)}/${time.getFullYear()}`;
                    var gio = `${number_format(time.getHours())}:${number_format(time.getMinutes())}:${number_format(time.getSeconds())}`;    
                    var trang_thai_hien_tai = data[i].trang_thai[data[i].trang_thai.length-1].trang_thai;
        
                    data[i].ngay_tao_don = ngay;
                    data[i].gio_tao = gio;
                    data[i].trang_thai_hien_tai = trang_thai_hien_tai;
                    data[i].ma_buu_cuc_nhan = data[i].receives_postal_office;
                }
                
                res.json({
                    checkBag: checkBag,
                    data: data
                })
                // res.render('./transaction_staff_view/danh_sach_don', {checkBag, data, transaction_staff_header})
            } else {
                res.json({
                    checkBag: checkBag
                })
            }
        })
        .catch(err => {
            res.status(500).send("Loi sv");
        })  
    }
    
    danh_sach_tui_nhan(req, res, next) {
        res.render('./warehouse_staff_view/danh_sach_tui_nhan', {warehouse_staff_header})
    }
    post_danh_sach_tui_nhan(req, res, next) {
        var tu_ngay = req.body.tu_ngay;
        var den_ngay = req.body.den_ngay;
        var postal_office_code = req.user_data.postal_office_code;
        console.log(tu_ngay, den_ngay, postal_office_code);

        var [day, month, year] = tu_ngay.split('/');
        const startTime = new Date(`${year}/${month}/${day}`);
        var [day, month, year] = den_ngay.split('/');
        const endTime = new Date(`${year}/${month}/${parseInt(day)+1}`);
        console.log(startTime, endTime)
        Parcel_bags.find({
                time: { $gte: startTime, $lte: endTime},
                receives_postal_office: postal_office_code
        })
        .then(data => {
            console.log(data.length)
            var checkBag = false;
            if(data.length != 0) {
                checkBag = true;
                var number_format = function(number) {
                    if(number.toString().length < 2){
                        return `0${number.toString()}`;
                    } else {
                        return number;
                    }
                }
                for(var i = 0; i< data.length; i++) {
                    data[i] = data[i].toObject();
                    var time = data[i].trang_thai[0].time;
                    var ngay = `${number_format(time.getDate())}/${number_format(time.getMonth() + 1)}/${time.getFullYear()}`;
                    var gio = `${number_format(time.getHours())}:${number_format(time.getMinutes())}:${number_format(time.getSeconds())}`;    
                    var trang_thai_hien_tai = data[i].trang_thai[data[i].trang_thai.length-1].trang_thai;
        
                    data[i].ngay_tao_don = ngay;
                    data[i].gio_tao = gio;
                    data[i].trang_thai_hien_tai = trang_thai_hien_tai;
                    data[i].xac_nhan_tui = (data[i].trang_thai[data[i].trang_thai.length-1].trang_thai == "Đã xác nhận nhận");
                    console.log(data[i])
                }
                
                res.json({
                    checkBag: checkBag,
                    data: data
                })
                // res.render('./transaction_staff_view/danh_sach_don', {checkBag, data, transaction_staff_header})
            } else {
                res.json({
                    checkBag: checkBag
                })
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).send("loi ben sv");
        })
    
    }

    thong_tin_tui(req, res, next) {
        var code_tracking = req.params.code_tracking;
        var number_format = function(number) {
            if(number.toString().length < 2){
                return `0${number.toString()}`;
            } else {
                return number;
            }
        }
        Parcel_bags.findById(code_tracking)
        .then(data => {
            
            if(data) {
                var send_postal_code = data.send_postal_office;
                var receives_postal_code = data.receives_postal_office;
                var time = data.time;
                var ngay = `${number_format(time.getDate())}/${number_format(time.getMonth() + 1)}/${time.getFullYear()}`;
                var product_id_list = data.product_list.map(product => {
                    return product.product_id;
                });

                var promises = product_id_list.map(product_id => {
                    return Parcels.findById(new ObjectId(product_id));
                })
                var data1 = {
                    code_tracking: code_tracking,
                    send_postal_code: send_postal_code,
                    receives_postal_code: receives_postal_code,
                    ngay: ngay
                }

                Promise.all(promises)
                .then(data_ => {

                    for(var i = 0; i < data_.length; i++) {
                        data_[i] = data_[i].toObject();
                        var time = data_[i].trang_thai[0].time;
                        var ngay = `${number_format(time.getDate())}/${number_format(time.getMonth() + 1)}/${time.getFullYear()}`;
                        var gio = `${number_format(time.getHours())}:${number_format(time.getMinutes())}:${number_format(time.getSeconds())}`;
                        data_[i].ngay_tao = ngay;
                        data_[i].gio_tao = gio;
                        data_[i].trang_thai_hien_tai = data_[i].trang_thai[data_[i].trang_thai.length-1].trang_thai;
                        data_[i].vi_tri_hien_tai = data_[i].trang_thai[data_[i].trang_thai.length-1].vi_tri;
                    }
                    

                    res.render('./warehouse_staff_view/thong_tin_tui_hang', {data1, data_, warehouse_staff_header})
                })
            } else {
                res.status(500).send("loi SV");
            }
        })
        .catch(err => {
            res.status(500).send("loi SV");
        })
        
    }


    xac_nhan_tui_den(req, res, next) {
        var code_tracking = new ObjectId(req.body.tracking_code);
        Parcel_bags.findById(code_tracking)
        .then(data => {
            var postal_office_code = data.receives_postal_office;
            Postal_office.findById(postal_office_code) 
            .then(data2 => {
                var vi_tri = data2.vi_tri;

                Parcel_bags.updateOne(
                    {_id: code_tracking},
                    {$push: {
                        "trang_thai" : {
                            trang_thai: "Đã xác nhận nhận",
                            time: Date.now(),
                            vi_tri: vi_tri,
                            postal_office_code: postal_office_code,
                        }
                    }}
                ).then(newData => {
                    if(newData) {
                        res.json({
                            message: true,
                        })
                    } else {
                        res.json({
                            message: false,
                        })
                    }
                })
                

            })
        }).catch(err => {
            res.json({
                message: false,
            })
        })
        
    }

    xac_nhan_chi_tiet_tui(req, res, next) {

        var number_format = function(number) {
            if(number.toString().length < 2){
                return `0${number.toString()}`;
            } else {
                return number;
            }
        } 


        var code_tracking = req.params.code_tracking;
        console.log(code_tracking);
        Parcel_bags.findById(new ObjectId(code_tracking))
        .then(data_ => {

            var time = data_.trang_thai[0].time;
            var ngay_gui = `${number_format(time.getDate())}/${number_format(time.getMonth() + 1)}/${time.getFullYear()}`;
            var data1 = {
                code_tracking: code_tracking,
                send_postal_code: data_.send_postal_office,
                receives_postal_code: data_.receives_postal_office,
                ngay_gui: ngay_gui,
            }

            var product_id_list = data_.product_list.map(product => {
                return product.product_id;
            });
            Parcels.find({_id: {$in: product_id_list}})
            .then(product_list => {
                console.log(product_list)
                for(var i = 0; i < product_list.length; i++) {
                    product_list[i] = product_list[i].toObject();
                    var time = product_list[i].trang_thai[0].time;
                    var ngay = `${number_format(time.getDate())}/${number_format(time.getMonth() + 1)}/${time.getFullYear()}`;
                    var gio = `${number_format(time.getHours())}:${number_format(time.getMinutes())}:${number_format(time.getSeconds())}`;

                    product_list[i].ngay = ngay;
                    product_list[i].gio = gio;
                    for(var j = 0; j< data_.product_list.length; j++) {
                        if(product_list[i]._id.toString() === data_.product_list[j].product_id.toString()) {
                            product_list[i].check = data_.product_list[j].check;
                            break;
                        }
                        
                    }
                }

                res.render('./warehouse_staff_view/xac_nhan_chi_tiet_tui', {data1,product_list, none_header: true})
            })
        }).catch(err => {
            res.status(500).send("loi SV")
        })
        

        
    }

    xac_nhan_item(req, res, next) {
        var code_tracking = req.body.code_tracking;
        var receives_postal_code = req.body.receives_postal_code;
        var parcel_bag_code = req.body.parcel_bag_code;
        console.log(parcel_bag_code)
        Postal_office.findById(receives_postal_code)
        .then(postal => {
            if(postal) {
                var vi_tri = postal.name;

                var arrPromise = [Parcels.updateOne(
                    {_id: new ObjectId(code_tracking)},
                    {$push: {
                        "trang_thai" : {
                            trang_thai: "Đã đến bưu cục",
                            time: Date.now(),
                            vi_tri: vi_tri,
                            postal_office_code: postal._id,
                        }
                    }}
                ).then(res_ => {
                    if(res_) {
                        return true;
                    }
                }),

                Parcel_bags.updateOne(
                    {_id: new ObjectId(parcel_bag_code), 'product_list.product_id' : new ObjectId(code_tracking)},
                    {$set: {'product_list.$.check': true}}
                ).then(res_ => {
                    if(res_) {
                        console.log(res_)
                        return true;
                    }
                }).catch(err => {
                    console.log(err)
                })]

                Promise.all(arrPromise)
                .then(res_ => {
                    if(res_.length == 2) {
                        res.json({
                            message: true,
                        })
                    } else {
                        res.json({
                            message: false
                        })
                    }
                })
            }
        })
        .catch(err => {
            res.json({
                message: false,
            })
        })
    }

    tra_cuu_don(req, res, next) {

        var tracking_code = req.query.code_tracking;
        console.log(tracking_code);


        var number_format = function(number) {
            if(number.toString().length < 2){
                return `0${number.toString()}`;
            } else {
                return number;
            }
        }
        var found_parcel = false;
        Parcels.findOne({_id: tracking_code})
        .then(data => {
            if(data) {
                found_parcel = true;
                data = data.toObject();
                var noi_gui = "";
                var noi_nhan = "";
                var promiseList = [
                    Postal_office.findById(data.send_postal_code)
                    .then(res => {
                        if(res) {
                            noi_gui = res.name;
                        }
                    }),
                    Postal_office.findById(data.recipient_postal_code)
                    .then(res => {
                        if(res) {
                            noi_nhan = res.name;
                        }
                    })
                ]
                var trang_thai = data.trang_thai[data.trang_thai.length-1].trang_thai;
                var list_trang_thai = data.trang_thai.map(trang_thai => {
                    var ngay = `${number_format(trang_thai.time.getDate())}/${number_format(trang_thai.time.getMonth() + 1)}/${trang_thai.time.getFullYear()}`;
                    var gio = `${number_format(trang_thai.time.getHours())}:${number_format(trang_thai.time.getMinutes())}:${number_format(trang_thai.time.getSeconds())    }`;
                    return {
                        ngay: ngay,
                        gio: gio,
                        trang_thai: trang_thai.trang_thai,
                        vi_tri : trang_thai.vi_tri,
                        chuyen_don: trang_thai.chuyen_don
                    }
                })
                
                
                Promise.all(promiseList)
                .then(tmp => {
                    res.render('./warehouse_staff_view/tra_cuu_don', {found_parcel,tracking_code,noi_gui, noi_nhan,trang_thai,list_trang_thai, data, warehouse_staff_header})
                })
                
            }else {
                res.render('./warehouse_staff_view/tra_cuu_don', {found_parcel, tracking_code,warehouse_staff_header})
            }
        })
        .catch(err => {
            
            res.render('./warehouse_staff_view/tra_cuu_don', {found_parcel, tracking_code, warehouse_staff_header})
        });

        // res.render('./transaction_staff_view/tra_cuu_don', {transaction_staff_header})
    }


    show_hoa_don(req, res, next) {
        var code_tracking = req.params.code_tracking;

        var number_format = function(number) {
            if(number.toString().length < 2){
                return `0${number.toString()}`;
            } else {
                return number;
            }
        }

        Parcels.findById(code_tracking)
        .then(parcel => {
            if(parcel) {
                parcel = parcel.toObject();

                
                var thoi_gian = `${number_format(parcel.trang_thai[0].time.getHours())}h${number_format(parcel.trang_thai[0].time.getMinutes())}/${number_format(parcel.trang_thai[0].time.getDate())}/${number_format(parcel.trang_thai[0].time.getMonth() + 1)}/${parcel.trang_thai[0].time.getFullYear()}`;
                
                var noi_gui = "";
                var noi_nhan = "";
                var promiseList = [
                    Postal_office.findById(parcel.send_postal_code)
                    .then(res => {
                        if(res) {
                            noi_gui = `${res.street}, ${parcel.send_commune}, ${parcel.send_district}, ${parcel.send_city}`;
                        }
                    }),
                    Postal_office.findById(parcel.recipient_postal_code)
                    .then(res => {
                        if(res) {
                            noi_nhan = `${res.street}, ${parcel.recipient_commune}, ${parcel.recipient_district}, ${parcel.recipient_city}`;
                        }
                    })
                ]
                Promise.all(promiseList)
                .then(tmp => {
                    parcel.send_address = noi_gui;
                    parcel.recipient_address = noi_nhan;
                    parcel.thoi_gian = thoi_gian;
                    var loai_hang = ["Tài liệu", "Hàng hóa"];
                    var chi_dan_gui = ["Chuyển hoàn ngay", "Gọi điện cho người gửi/BC gửi", "Hủy", "Chuyển hoàn trước ngày", "Chuyển hoàn khi hết thời gian lưu trữ"]
                    parcel.loai_hang = loai_hang.indexOf(parcel.loai_hang);
                    parcel.chi_dan_gui = chi_dan_gui.indexOf(parcel.chi_dan_gui);
                    console.log(parcel.chi_dan_gui, parcel.loai_hang);
                    res.render('./transaction_staff_view/hoadon', {parcel, none_header: true })
                })


                
            }
            else {
                res.status(500).send("Khong tim thay buu gui")
            }
            
        })
        .catch(err => {
            console.log(err)
            res.status(500).send("loi ben sv");
        })
        // console.log(code_tracking)
        // res.render('./transaction_staff_view/hoadon',{none_header: true })
    }


}

export default new Warehouse_staffController;
