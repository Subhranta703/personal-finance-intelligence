import {Schema,model} from 'mongoose';
const schema=new Schema({userId:{type:Schema.Types.ObjectId,ref:'User',required:true,index:true},merchant:String,amount:Number,frequency:String,annualCost:Number,nextExpected:Date,confidence:Number,isConfirmed:Boolean},{timestamps:true}); export const Subscription=model('Subscription',schema);
