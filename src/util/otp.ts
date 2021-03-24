import otpGenerator from 'otp-generator';

export class OTP {
    public static create(maxLength: number = 6) {
        return otpGenerator.generate(maxLength, { upperCase: false, specialChars: false, alphabets: false })
    }
}
