import mongoose, { Schema } from 'mongoose';

interface IUserSession {
    user: Schema.Types.ObjectId;
    key: string;
    ip: string;
    detail: string;
    expire_at: number;
    create_at: number;
    update_at: number;
}

const schema = new Schema<IUserSession>({
    user: { type: Schema.Types.ObjectId, ref: 'user', required: true },
    key: { type: String, required: true },
    ip: { type: String, required: true },
    detail: { type: String, required: true },
    expire_at: { type: Number, required: true },
    create_at: { type: Number, required: true },
    update_at: { type: Number, required: true }
});

export default mongoose.models.user_session || mongoose.model<IUserSession>('user_session', schema, 'user_session');