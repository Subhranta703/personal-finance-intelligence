import {Schema,model,Types} from 'mongoose';
const schema=new Schema({userId:{type:Schema.Types.ObjectId,ref:'User',required:true,index:true},type:{type:String,enum:['income','expense','transfer'],required:true},amount:{type:Number,min:0,required:true},category:{type:String,required:true,index:true},merchant:{type:String,required:true,index:true},description:String,date:{type:Date,required:true,index:true},paymentMethod:{type:String,enum:['cash','upi','credit_card','debit_card','bank_transfer','other'],default:'upi'},notes:String,source:{type:String,default:'manual'},confidence:{type:Number,min:0,max:1,default:1}},{timestamps:true});
schema.index({userId:1,date:-1}); schema.index({userId:1,category:1,date:-1});
export const Transaction=model('Transaction',schema);
