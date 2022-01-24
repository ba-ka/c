import mongoose, { Schema } from 'mongoose';

interface IKami {
    title: string;
    excerpt: string;
    content: string;
    status: string;
    author: string | Schema.Types.ObjectId;
    create_at: number;
    update_at: number;
}

const schema = new Schema<IKami>({
    title: { type: String, required: true },
    excerpt: { type: String, required: true },
    content: { type: String, required: true },
    status: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'user', required: true },
    create_at: { type: Number, required: true },
    update_at: { type: Number, required: true }
});

export default mongoose.models.kami || mongoose.model<IKami>('kami', schema, 'kami');