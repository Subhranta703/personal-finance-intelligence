import {Schema,model} from 'mongoose';
const schema=new Schema({userId:{type:Schema.Types.ObjectId,ref:'User',required:true,index:true},type:String,title:String,description:String,severity:String,data:Schema.Types.Mixed},{timestamps:true}); export const Insight=model('Insight',schema);
