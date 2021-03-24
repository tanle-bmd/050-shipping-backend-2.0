import { Service } from "@tsed/common";

import { CoreService } from "../core/services/CoreService";

import { Staff } from "../entity/Staff";
import { validatePassword } from "../util/passwordHelper";
import { Permission } from '../entity/Permission';
import { Exception } from "ts-httpexceptions";

@Service()
export class StaffService extends CoreService {
    /**
     * =====================LOGIN=====================
     */
    public async login(username: string, password: string): Promise<Staff> {
        //because select password is false for config
        const staff = await Staff.findOneOrThrowOption({
            select: ["password", "id", "isBlock"],
            where: { username },
        })

        let validate = await validatePassword(password, staff.password)
        if (!validate)
            return null

        return staff
    }

    /**
     * =====================IS VALID PASSWORD=====================
     * Return null if not valid
     * Else return admin
     */
    public async isValidPassword(id: number, password: string): Promise<Staff> {
        //because select password is false for config
        const staff = await Staff.findOneOrThrowOption({
            select: ["password", "id"],
            where: { id }
        })

        let validate = await validatePassword(password, staff.password)
        if (!validate)
            return null

        return staff
    }

    /**
     * =====================GET PERMISSION=====================
     */
    public async getPermission(staffId: number): Promise<Permission[]> {
        return Permission.createQueryBuilder("p")
            .leftJoin("p.roles", "r")
            .leftJoin("r.staff", "a")
            .where("a.id = :staffId", { staffId })
            .getMany()
    }

    /**
     * =====================CHECK DUPLICATE=====================
     */
    async checkDuplicate(staff: Staff, userId: number = null) {
        const { username, phone, email } = staff
        const oldStaff = await Staff.findOne({
            where: [
                { username },
                { phone },
                { email }
            ]
        })

        let message = ""
        if (oldStaff && oldStaff.id != userId) {
            if (oldStaff.username == staff.username) {
                message = "Tài khoản"
            }
            else if (oldStaff.phone == staff.phone) {
                message = "Số điện thoại"
            }
            else if (oldStaff.email == staff.email) {
                message = "Email"
            }
            throw new Exception(400, `Trùng ${message} với nhân viên khác`)
        }
    }
}
