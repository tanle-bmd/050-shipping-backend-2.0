import bcrypt from 'bcrypt';

const saltRounds = 12;

export const hashPassword = (password: string): Promise<string> => {
    return bcrypt.hash(password, saltRounds)
}

export const validatePassword = (password: string, hash: string): Promise<boolean> => {
    return bcrypt.compare(password, hash)
}
