import {Schema,model} from 'mongoose';
const schema=new Schema({userId:{type:Schema.Types.ObjectId,ref:'User',required:true,index:true},category:{type:String,required:true},month:{type:String,required:true},amount:{type:Number,min:0,required:true},threshold:{type:Number,default:80}},{timestamps:true});
schema.index({userId:1,category:1,month:1},{unique:true}); export const Budget=model('Budget',schema);
