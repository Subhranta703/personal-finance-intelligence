import {Request,Response} from 'express';import {Transaction} from '../models/Transaction';import {parseQuick,categorize,normalizeMerchant} from '../algorithms/categorize';import {z} from 'zod';
const input=z.object({type:z.enum(['income','expense','transfer']),amount:z.number().positive(),category:z.string().min(1).optional(),merchant:z.string().min(1),description:z.string().optional(),date:z.coerce.date(),paymentMethod:z.enum(['cash','upi','credit_card','debit_card','bank_transfer','other']).default('upi'),notes:z.string().optional()});
export async function list(req:Request,res:Response){const page=Math.max(Number(req.query.page)||1,1),limit=Math.min(Number(req.query.limit)||20,100);const q=String(req.query.q||'');const filter:any={userId:req.userId};if(q)filter.$or=[{merchant:new RegExp(q,'i')},{description:new RegExp(q,'i')},{category:new RegExp(q,'i')}];const [items,total]=await Promise.all([Transaction.find(filter).sort({date:-1}).skip((page-1)*limit).limit(limit),Transaction.countDocuments(filter)]);res.json({items,total,page,limit})}
export async function create(req: Request, res: Response) {
  const p = input.parse(req.body);

  const cat =
    p.category ||
    categorize(`${p.merchant} ${p.description || ""}`).category;

  const merchant = normalizeMerchant(p.merchant);

  // Check whether this user still has demo transactions
  const hasDemoData = await Transaction.exists({
    userId: req.userId,
    isDemo: true,
  });

  // If demo data exists, this is the user's first real transaction.
  // Remove ONLY demo transactions.
  if (hasDemoData) {
    await Transaction.deleteMany({
      userId: req.userId,
      isDemo: true,
    });
  }

  // Create the actual user transaction
  const t = await Transaction.create({
    ...p,
    userId: req.userId,
    category: cat,
    merchant,

    // Explicitly mark as real data
    isDemo: false,
  });

  res.status(201).json(t);
}
export async function quick(req: Request, res: Response) {
  const p = parseQuick(String(req.body.text || ""));

  if (!p.amount) {
    return res.status(422).json({
      message: "Enter an amount, e.g. ₹450 Swiggy",
    });
  }

  // Check for demo data
  const hasDemoData = await Transaction.exists({
    userId: req.userId,
    isDemo: true,
  });

  // First real transaction removes demo data
  if (hasDemoData) {
    await Transaction.deleteMany({
      userId: req.userId,
      isDemo: true,
    });
  }

  const t = await Transaction.create({
    userId: req.userId,
    type: "expense",
    amount: p.amount,
    category: p.category,
    merchant: p.merchant,
    description: String(req.body.text),
    date: new Date(),
    paymentMethod: "upi",
    source: "quick-add",
    confidence: p.confidence,

    // Real transaction
    isDemo: false,
  });

  res.status(201).json(t);
}

export async function update(req:Request,res:Response){const p=input.partial().parse(req.body);const t=await Transaction.findOneAndUpdate({_id:req.params.id,userId:req.userId},p,{new:true});if(!t)return res.status(404).json({message:'Transaction not found'});res.json(t)}
export async function remove(req:Request,res:Response){const t=await Transaction.findOneAndDelete({_id:req.params.id,userId:req.userId});if(!t)return res.status(404).json({message:'Transaction not found'});res.json({message:'Deleted'})}
