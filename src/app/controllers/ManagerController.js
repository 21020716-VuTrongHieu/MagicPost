import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;
import Parcels from "../models/Parcels.js";
import Postal_office from "../models/Postal_office.js";
import Parcel_bags from "../models/Parcel_bags.js";
import jwt from 'jsonwebtoken';
import Users from '../models/User.js'
import Validation from '../controllers/checkForm.js';
const manager_header = true;

class ManagerController {

    tra_cuu_don(req, res, next) {

        var tracking_code = req.query.code_tracking;
        console.log(tracking_code);


        var number_format = function (number) {
            if (number.toString().length < 2) {
                return `0${number.toString()}`;
            } else {
                return number;
            }
        }
        var found_parcel = false;
        Parcels.findOne({ _id: tracking_code })
            .then(data => {
                if (data) {
                    found_parcel = true;
                    data = data.toObject();
                    var noi_gui = "";
                    var noi_nhan = "";
                    var promiseList = [
                        Postal_office.findById(data.send_postal_code)
                            .then(res => {
                                if (res) {
                                    noi_gui = res.name;
                                }
                            }),
                        Postal_office.findById(data.recipient_postal_code)
                            .then(res => {
                                if (res) {
                                    noi_nhan = res.name;
                                }
                            })
                    ]
                    var trang_thai = data.trang_thai[data.trang_thai.length - 1].trang_thai;
                    var list_trang_thai = data.trang_thai.map(trang_thai => {
                        var ngay = `${number_format(trang_thai.time.getDate())}/${number_format(trang_thai.time.getMonth() + 1)}/${trang_thai.time.getFullYear()}`;
                        var gio = `${number_format(trang_thai.time.getHours())}:${number_format(trang_thai.time.getMinutes())}:${number_format(trang_thai.time.getSeconds())}`;
                        return {
                            ngay: ngay,
                            gio: gio,
                            trang_thai: trang_thai.trang_thai,
                            vi_tri: trang_thai.vi_tri,
                            chuyen_don: trang_thai.chuyen_don
                        }
                    })


                    Promise.all(promiseList)
                        .then(tmp => {
                            res.render('./manager_view/tra_cuu_don', { found_parcel, tracking_code, noi_gui, noi_nhan, trang_thai, list_trang_thai, data, manager_header })
                        })

                } else {
                    res.render('./manager_view/tra_cuu_don', { found_parcel, tracking_code, manager_header })
                }
            })
            .catch(err => {

                res.render('./manager_view/tra_cuu_don', { found_parcel, tracking_code, manager_header })
            });

        // res.render('./transaction_staff_view/tra_cuu_don', {transaction_staff_header})
    }


    show_hoa_don(req, res, next) {
        var code_tracking = req.params.code_tracking;

        var number_format = function (number) {
            if (number.toString().length < 2) {
                return `0${number.toString()}`;
            } else {
                return number;
            }
        }

        Parcels.findById(code_tracking)
            .then(parcel => {
                if (parcel) {
                    parcel = parcel.toObject();


                    var thoi_gian = `${number_format(parcel.trang_thai[0].time.getHours())}h${number_format(parcel.trang_thai[0].time.getMinutes())}/${number_format(parcel.trang_thai[0].time.getDate())}/${number_format(parcel.trang_thai[0].time.getMonth() + 1)}/${parcel.trang_thai[0].time.getFullYear()}`;

                    var noi_gui = "";
                    var noi_nhan = "";
                    var promiseList = [
                        Postal_office.findById(parcel.send_postal_code)
                            .then(res => {
                                if (res) {
                                    noi_gui = `${res.street}, ${parcel.send_commune}, ${parcel.send_district}, ${parcel.send_city}`;
                                }
                            }),
                        Postal_office.findById(parcel.recipient_postal_code)
                            .then(res => {
                                if (res) {
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
                            res.render('./manager_view/hoadon', { parcel, none_header: true })
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
        // res.render('./manager_view/hoadon',{none_header: true })
    }
    showList(req, res, next) {
        var token = req.cookies.token;
        var user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        var user_id = user._id;
        var list = ["warehouse_manager", "transaction_manager"];
    
        Users.find({ role: { $in: list } }).then(async (data) => {
    
            // Assuming postal_office_code is a field in the Users collection
            const updatedData = await Promise.all(data.map(async (acc) => {
                var post_code = acc.postal_office_code;
    
                const postalOffice = await Postal_office.findOne({ _id: post_code });
    
                const postalOfficeName = postalOffice ? postalOffice.name : 'Unknown Postal Office';
                var info = acc.toObject();
                info.postal_name = postalOfficeName;
                return info;  
            }));
            console.log(updatedData);
            data = updatedData;
            res.render('./manager_view/list_manager', { data, manager_header });
        }).catch(error => {
            // Handle errors
            console.error(error);
            res.status(500).send('Internal Server Error');
        });
    }
    async addEmployee(req, res, next) {
        //console.log(req.body);
        var data = req.body;
        var token = req.cookies.token;
        var user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        // data = data.map(data => data.toObject());
        var name = data.name.trim();
        var email = data.email.trim();
        var username = data.username.trim();
        var password = data.password;
        var role = data.role.trim();
        var postal_office_code = data.postal_office_code;
        // console.log(role, postal_office_code);
        name = name.replace(/\s+/g, ' ').toLowerCase().split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        username = username.toLowerCase();
        // console.log(name);  
        var log_name = Validation.checkName(name);
        var log_email = Validation.checkEmail(email);
        var log_username = Validation.checkUsername(username);
        var log_password = Validation.checkPassword(password);
        var log_postal_office_code = await Validation.checkPostal(role, postal_office_code);
        // console.log("log postal office code:" + log_postal_office_code);
        // let isSuccess = false;
        if (log_name == '' && log_email == '' && log_username == '' && log_password == '' && log_postal_office_code == '') {
            Users.find({ username: username }).then(
                data => {
                    console.log('Data: ' + data);
                    data = data.map(data => data.toObject());
                    console.log('Data: ' + data.length);
                    if (data.length) {
                        // isSuccess = false;
                        // log_username = 'Tên đăng nhập đã tồn tại';
                        res.json({
                            status: false,
                            name: log_name,
                            email: log_email,
                            username: 'Tên đăng nhập đã tồn tại',
                            password: log_password,
                            postal_office_code: log_postal_office_code
                        });
                    }
                    else {
                        // isSuccess = true;
                        // capitalizeWords(name).then(str => {
                        //     console.log(str);
                        // })
                        var account = {
                            name: name,
                            role: role,
                            email: email,
                            password: password,
                            username: username,
                            postal_office_code: postal_office_code
                        }
                        Users.create(account).then(response => {
                            res.json({
                                status: true,
                                name: log_name,
                                email: log_email,
                                username: log_username,
                                password: log_password,
                                postal_office_code: log_postal_office_code
                            });
                        }
                        ).catch(err => {
                            res.status(500).send(err);
                        });

                    }

                }
            )
        } else {
            res.json({
                status: false,
                name: log_name,
                email: log_email,
                username: log_username,
                password: log_password,
                postal_office_code: log_postal_office_code
            });
        }
        // console.log(log_username);

    }

    getAccount(req, res, next) {
        // console.log('Haha' + req.body);  
        var id = req.params.id;
        // console.log('Haha' + id); 
        var token = req.cookies.token;
        var user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        Users.findById(id).then(data => {
            data = data.toObject();
            if (data && data.postal_office_code == user.postal_office_code) {
                res.json({
                    name: data.name,
                    email: data.email,
                    username: data.username,
                    password: data.password
                });
            } else {
                res.status(500).send("Not Found");
            }
        }).catch(err => {
            res.status(500).send(err);
        })
    }

    async editEmployee(req, res, next) {
        // console.log(req.body);
        var data = req.body;
        var token = req.cookies.token;
        var user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        // data = data.map(data => data.toObject());
        var id = req.params.id;
        var name = data.name.trim();
        var email = data.email.trim();
        var username = data.username.trim();
        var password = data.password;
        var role = data.role.trim();
        var postal_office_code = data.postal_office_code;
        name = name.replace(/\s+/g, ' ').toLowerCase().split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        username = username.toLowerCase();
        // console.log(name);  
        var log_name = Validation.checkName(name);
        var log_email = Validation.checkEmail(email);
        var log_username = Validation.checkUsername(username);
        var log_password = Validation.checkPassword(password);
        var log_postal_office_code = await Validation.checkPostal(role, postal_office_code);
        // console.log(username);
        // let isSuccess = false;
        if (log_name == '' && log_email == '' && log_username == '' && log_password == '' && log_postal_office_code == '') {
            Users.find({ username: username }).then(
                data => {
                    // console.log('Data: ' + data);
                    data = data.map(data => data.toObject());
                    // console.log('Data: ' + data.length);
                    if (!data.length) {
                        // isSuccess = false;
                        // log_username = 'Tên đăng nhập đã tồn tại';
                        res.json({
                            status: false,
                            name: log_name,
                            email: log_email,
                            username: 'Tên đăng nhập không tồn tại',
                            password: log_password,
                            postal_office_code: log_postal_office_code
                        });
                    }
                    else {
                        // isSuccess = true;
                        // capitalizeWords(name).then(str => {
                        //     console.log(str);
                        // })
                        var account = {
                            name: name,
                            role: role,
                            email: email,
                            password: password,
                            username: username,
                            postal_office_code: postal_office_code
                        }
                        Users.updateOne({ username: username }, {
                            name: name,
                            password: password,
                            email: email
                        })
                            .then(response => {
                                res.json({
                                    status: true,
                                    name: log_name,
                                    email: log_email,
                                    username: log_username,
                                    password: log_password,
                                    postal_office_code: log_postal_office_code
                                });
                            }
                            ).catch(err => {
                                res.status(500).send(err);
                            });

                    }

                }
            )
        } else {
            res.json({
                status: false,
                name: log_name,
                email: log_email,
                username: log_username,
                password: log_password,
                postal_office_code: log_postal_office_code
            });
        }
        // console.log(log_username);

    }
    deleteAccount(req, res, next) {
        var token = req.cookies.token;
        var user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        var data = req.body.list;

        const indexToRemove = data.indexOf(user._id);

        if (indexToRemove !== -1) {
            data.splice(indexToRemove, 1);
            // console.log(`Phần tử ${elementToRemove} đã bị xóa.`);
        }
        // console.log(data);
        // console.log(user._id);
        Users.deleteMany({ _id: { $in: data } })
            .then(number => {
                res.json({
                    number: data.length,
                })
            })
            .catch(err => {
                res.status(500).send(err);
            })
    }
    getPostalOffice(req, res, next) {
        const selectedWorkspace = req.query.role;
        if (selectedWorkspace && (selectedWorkspace === 'warehouse' || selectedWorkspace === 'postal_office')) {
            // console.log(selectedWorkspace);
            Postal_office.find({ role: selectedWorkspace }).then(async data => {
                // console.log(data);
                data = data.map(data => data.toObject());
                res.json(data);
            });
        } else {
            res.status(400).json({ error: 'Invalid workspace' });
        }
    }
}

export default new ManagerController;
