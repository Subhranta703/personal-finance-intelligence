import {Request,Response} from 'express';import {Types} from 'mongoose';
import {Transaction} from '../models/Transaction';
import {Budget} from '../models/Budget';
import {Subscription} from '../models/Subscription';
import {overview,anomalies,budgetStatus} from '../services/analytics';

export async function categories(req:Request,res:Response){const tx=await Transaction.aggregate([{$match:{userId:new Types.ObjectId(req.userId),type:'expense'}},{$group:{_id:'$category',total:{$sum:'$amount'}}},{$sort:{total:-1}}]);res.json(tx.map((x:any)=>({category:x._id,total:x.total})))}
export async function trends(req:Request,res:Response){const tx=await Transaction.aggregate([{$match:{userId:new Types.ObjectId(req.userId)}},{$group:{_id:{y:{$year:'$date'},m:{$month:'$date'},type:'$type'},total:{$sum:'$amount'}}},{$sort:{'_id.y':1,'_id.m':1}}]);res.json(tx)}
export async function insights(req:Request,res:Response){const o=await overview(req.userId!);const a=await anomalies(req.userId!);const top=Object.entries(o.byCategory).sort((x,y)=>Number(y[1])-Number(x[1]))[0];const out:any[]=[];if(top)out.push({type:'spending',title:'Largest category',description:`${top[0]} is your largest expense category this month.`,severity:'info',data:{category:top[0],amount:top[1]}});if(a.length)out.push({type:'anomaly',title:'Unusual spending',description:`${a.length} transactions were flagged as unusual-spending indicators.`,severity:'warning',data:{count:a.length}});out.push({type:'savings',title:'Savings rate',description:`Your current savings rate is ${o.savingsRate.toFixed(1)}%.`,severity:'positive',data:{savingsRate:o.savingsRate}});res.json(out)}
export async function createBudget(req: Request, res: Response) {
  try {
    const {
      category,
      month,
      amount,
      threshold = 80,
    } = req.body;

    if (!category || !month || amount === undefined) {
      return res.status(400).json({
        message: "Category, month and amount are required",
      });
    }

    const numericAmount = Number(amount);
    const numericThreshold = Number(threshold);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        message: "Budget amount must be greater than 0",
      });
    }

    if (
      !Number.isFinite(numericThreshold) ||
      numericThreshold < 1 ||
      numericThreshold > 100
    ) {
      return res.status(400).json({
        message: "Threshold must be between 1 and 100",
      });
    }

    const b = await Budget.findOneAndUpdate(
      {
        userId: req.userId,
        category: String(category).trim(),
        month: String(month),
      },
      {
        userId: req.userId,
        category: String(category).trim(),
        month: String(month),
        amount: numericAmount,
        threshold: numericThreshold,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    res.status(201).json(b);
  } catch (error) {
    console.error("Create budget error:", error);

    res.status(500).json({
      message: "Failed to save budget",
    });
  }
}
export async function deleteBudget(req:Request,res:Response){const b=await Budget.findOneAndDelete({_id:req.params.id,userId:req.userId});if(!b)return res.status(404).json({message:'Budget not found'});res.json({message:'Deleted'})}
export async function subscriptions(req:Request,res:Response){res.json(await Subscription.find({userId:req.userId}).sort({amount:-1}))}
