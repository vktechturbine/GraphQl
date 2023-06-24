import mongoose from 'mongoose';

const Schema = mongoose.Schema;

export const userSchema = new Schema({
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    name:{
        type:String,
        required:true
    },
    status:{
        type:String,
        default:"i am new user"
    },
    posts:[{
        type:Schema.Types.ObjectId,
        ref:'Post',
    }]
})

export default  mongoose.model('User',userSchema);