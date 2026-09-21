import {Request,Response,NextFunction} from 'express'; import jwt from 'jsonwebtoken'; import {env} from '../config/env';
declare global {namespace Express {interface Request {userId?:string}}}
export function auth(req:Request,res:Response,next:NextFunction){try{const token=req.cookies?.finsight_token;if(!token)return res.status(401).json({message:'Authentication required'});const p=jwt.verify(token,env.JWT_SECRET) as {id:string};req.userId=p.id;next()}catch{return res.status(401).json({message:'Invalid or expired session'})}}
