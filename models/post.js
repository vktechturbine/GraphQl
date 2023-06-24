import  mongoose from 'mongoose';

const Schema = mongoose.Schema;

export const PostSchema = new Schema({
    title:{
        type:String,
        required:true,
    },
    content:{
        type:String,
        required:true,
    },
    fileName:{
        type:String,
        required:true
    },
    imageUrl:{
        type:String,
        required:true
    },
    creator:{
        type:Schema.Types.ObjectId,
        ref:'User',
        required:true
    }
},
{timestamps:true}
);

export default mongoose.model('Post',PostSchema)