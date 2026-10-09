import { NextRequest,NextResponse } from 'next/server';
import { createSession } from '../../../../lib/auth';
export async function GET(req:NextRequest){
 const state=req.nextUrl.searchParams.get('state'),saved=req.cookies.get('oauth_state')?.value,code=req.nextUrl.searchParams.get('code');
 if(!state||!saved||state!==saved||!code)return NextResponse.json({error:'Invalid OAuth state or code'},{status:400});
 const data=new URLSearchParams({client_id:process.env.DISCORD_CLIENT_ID!,client_secret:process.env.DISCORD_CLIENT_SECRET!,grant_type:'authorization_code',code,redirect_uri:process.env.DISCORD_REDIRECT_URI!});
 const tokenRes=await fetch('https://discord.com/api/v10/oauth2/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:data,cache:'no-store'});
 if(!tokenRes.ok)return NextResponse.json({error:'OAuth exchange failed'},{status:401});
 const tokens=await tokenRes.json();
 const meRes=await fetch('https://discord.com/api/v10/users/@me',{headers:{Authorization:`Bearer ${tokens.access_token}`},cache:'no-store'});
 if(!meRes.ok)return NextResponse.json({error:'Could not fetch profile'},{status:401});
 const me=await meRes.json();const jwt=await createSession({id:me.id,username:me.username,accessToken:tokens.access_token},tokens.expires_in);
 const res=NextResponse.redirect(new URL('/dashboard',req.url));res.cookies.set('sentinel_session',jwt,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:Math.min(tokens.expires_in,3600)});res.cookies.delete('oauth_state');return res;
}
