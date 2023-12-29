import Users from '../models/User.js'
class Validation {

    checkName(name) {
        const regex = /^[^0-9!@#$%^&*()_+={}\[\]:;<>,.?\/\\`~]*$/;
        if (regex.test(name)) {
            return '';
        }
        return "Họ và tên không hợp lệ"
    }

    checkEmail(email) {
        const regex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g;
        return regex.test(email) ? '' : 'Email không hợp lệ';
    }

    checkUsername(username) {
        const regex = /^[a-zA-Z][a-zA-Z0-9_]{5,14}$/;
        return regex.test(username) ? '' : 'Tên đăng nhập không hợp lệ';
    }
    checkPassword(password) {
        const regex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&_])[A-Za-z\d@$!%*?&_]{8,}$/;
        return regex.test(password) ? '' : 'Mật khẩu phải có độ dài ít nhất là 8, chứa ít nhất 1 ký tự viết hoa, 1 ký tự viết thường, 1 ký tự số và 1 ký tự đặc biệt'
    }
    checkPostal(user_role, postal_id) {
        var res = Users.findOne({ postal_office_code: postal_id, role: user_role })
            .then(manager => {
                console.log("check postal:" + manager);
                if (manager !== null) {
                    return 'Địa điểm này đã có người quản lý';
                } else {
                    return '';
                }
            });
        return res;
    }
    
}

export default new Validation;