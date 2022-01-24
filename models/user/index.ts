import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';

interface IUser {
    username: string;
    avatar: string;
    password: string;
    create_at: number;
    update_at: number;
}

const schema = new Schema<IUser>({
    username: { type: String, required: true },
    avatar: { type: String, required: true },
    password: { type: String, required: true },
    create_at: { type: Number, required: true },
    update_at: { type: Number, required: true }
});

schema.pre("save", function (next) {
    const data = this
    if (data.isModified("password") || data.isNew) {
        bcrypt.genSalt(10, function (error, password_salt) {
            if (error) {
                return next(error);
            } else {
                bcrypt.hash(data.password, password_salt, function (error, password_hash) {
                    if (error) { return next(error) }
                    data.password = password_hash;
                    next()
                })
            }
        })
    } else {
        return next()
    }
});

export default mongoose.models.user || mongoose.model<IUser>('user', schema, 'user');