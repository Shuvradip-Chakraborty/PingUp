import mongoose from 'mongoose'

//defining the schema
const connectionSchema = new mongoose.Schema({
    from_user_id: {type: String, ref: 'User', required: true},
    to_user_id: {type: String, ref: 'User', required: true},
    status: {type: String, enum: ['pending', 'accepted'], default: 'pending'},
}, {timestamps: true})

//using the schema creating the model
const Connection = mongoose.model('Connection', connectionSchema)


export default Connection