import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
const secret=()=>{if(!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length<32) throw Error('SESSION_SECRET must have at least 32 characters');return new TextEncoder().encode(process.env.SESSION_SECRET);};
export type Session={id:string;username:string;accessToken:string};
export async function createSession(user:Session,expiresIn:number){return new SignJWT(user).setProtectedHeader({alg:'HS256'}).setIssuedAt().setExpirationTime(Math.min(expiresIn,3600)+'s').sign(secret());}
export async function session():Promise<Session|null>{const token=(await cookies()).get('sentinel_session')?.value;if(!token)return null;try{const {payload}=await jwtVerify(token,secret());return {id:String(payload.id),username:String(payload.username),accessToken:String(payload.accessToken)};}catch{return null;}}
export async function managedGuilds(){const s=await session();if(!s)return null;const response=await fetch('https://discord.com/api/v10/users/@me/guilds',{headers:{Authorization:`Bearer ${s.accessToken}`},cache:'no-store'});if(!response.ok)return null;const guilds=await response.json() as Array<{id:string;name:string;permissions:string;owner:boolean}>;return guilds.filter(g=>g.owner || (BigInt(g.permissions)&(1n<<5n))!==0n || (BigInt(g.permissions)&(1n<<3n))!==0n);}
export async function canManage(id:string){const guilds=await managedGuilds();return guilds?.some(g=>g.id===id)??false;}
