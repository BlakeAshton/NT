import { canManage,managedGuilds,session } from '../../../lib/auth';
import { notFound,redirect } from 'next/navigation';
import Settings from './settings';
export default async function GuildPage({params}:{params:Promise<{id:string}>}){const {id}=await params;if(!await session())redirect('/api/auth/login');if(!await canManage(id))notFound();const guild=(await managedGuilds())?.find(g=>g.id===id);return <section><a href="/dashboard">← Servers</a><span className="eyebrow">SERVER SETTINGS</span><h1>{guild?.name}</h1><Settings guildId={id}/></section>}
