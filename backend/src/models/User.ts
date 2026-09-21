import {Schema,model,Types} from 'mongoose';
const schema=new Schema({name:{type:String,required:true,trim:true},email:{type:String,required:true,unique:true,lowercase:true,trim:true},passwordHash:{type:String,required:true}},{timestamps:true});
export const User=model('User',schema);
export type UserDoc={_id:Types.ObjectId;name:string;email:string;passwordHash:string};
