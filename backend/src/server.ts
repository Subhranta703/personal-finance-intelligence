import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import {env} from './config/env';
import routes from './routes';


const app=express();app.use(cors({origin:'http://localhost:3000',credentials:true}));app.use(express.json({limit:'1mb'}));app.use(cookieParser());app.use(rateLimit({windowMs:15*60*1000,max:300,standardHeaders:true,legacyHeaders:false}));app.get('/health',(_,res)=>res.json({ok:true,name:'FinSight API'}));app.use('/api',routes);app.use((err:any,_req:any,res:any,_next:any)=>{console.error(err);res.status(err?.name==='ZodError'?422:500).json({message:err?.name==='ZodError'?'Validation failed':'Internal server error'})});
async function start(){try{await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/finsight");console.log('MongoDB connected')}catch(e){console.error('MongoDB connection failed:',e)}app.listen(env.PORT,()=>console.log(`FinSight API running on ${env.PORT}`))}start();
export default app;
