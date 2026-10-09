import { NextRequest,NextResponse } from 'next/server';
import { db } from '@sentinel/db';
import { canManage } from '../../../../../lib/auth';
import { z } from 'zod';
const schema=z.object({logChannelId:z.union([z.string().regex(/^\d{17,20}$/),z.null()]).optional(),antiRaidEnabled:z.boolean().optional(),raidJoinLimit:z.number().int().min(3).max(100).optional(),raidWindowSeconds:z.number().int().min(5).max(300).optional()}).strict();
type Context={params:Promise<{id:string}>};
export async function GET(_req:NextRequest,{params}:Context){const {id}=await params;if(!await canManage(id))return NextResponse.json({error:'Forbidden'},{status:403});return NextResponse.json(await db.guildSettings.findUnique({where:{guildId:id}})??{guildId:id,antiRaidEnabled:false,raidJoinLimit:10,raidWindowSeconds:30,logChannelId:null});}
export async function PATCH(req:NextRequest,{params}:Context){const {id}=await params;if(!await canManage(id))return NextResponse.json({error:'Forbidden'},{status:403});const json=await req.json().catch(()=>null);const parsed=schema.safeParse(json);if(!parsed.success)return NextResponse.json({error:parsed.error.flatten()},{status:400});const data=parsed.data;const result=await db.guildSettings.upsert({where:{guildId:id},create:{guildId:id,...data},update:data});return NextResponse.json(result);}
