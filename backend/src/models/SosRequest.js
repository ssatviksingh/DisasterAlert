import mongoose from 'mongoose';
const { Schema } = mongoose;


const SosSchema = new Schema({
    title: String,
    description: String,
    user_id: { type: Schema.Types.ObjectId, ref: 'User' },
    location: { type: { type: String, default: 'Point' }, coordinates: [Number] },
    status: { type: String, default: 'pending' },
    files: [String],
    created_at: { type: Date, default: Date.now },
});


SosSchema.index({ location: '2dsphere' });
export default mongoose.model('SosRequest', SosSchema);