/** Supabase Auth + per-user projects. A public client key is expected: never use service_role keys here. */
let client=null;
let currentUser=null;
let listeners=new Set();
const configuration=()=>globalThis.SMART_CALENDAR_CONFIG||{};
export function cloudConfigured(){const c=configuration();return /^https:\/\/[\w.-]+\.supabase\.co\/?$/.test(c.supabaseUrl||'')&&Boolean(c.supabaseAnonKey&&c.supabaseAnonKey.length>15);}
export function cloudUser(){return currentUser;}
export function cloudClient(){return client;}
export function listenAuth(callback){listeners.add(callback);return ()=>listeners.delete(callback);}
function notify(){for(const cb of listeners)try{cb(currentUser)}catch(err){console.error(err)}}
export async function initCloud(){
 if(!cloudConfigured())return false;
 if(!globalThis.supabase?.createClient)throw new Error('Libreria di autenticazione non disponibile. Controlla la connessione.');
 if(client)return true;
 const c=configuration();
 client=globalThis.supabase.createClient(c.supabaseUrl,c.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 const {data,error}=await client.auth.getUser();if(error&&!/Auth session missing/i.test(error.message||''))console.warn('Accesso cloud:',error.message);
 currentUser=data?.user||null;
 client.auth.onAuthStateChange((_event,session)=>{const previous=currentUser?.id||null;currentUser=session?.user||null;if(previous!==(currentUser?.id||null))notify();});
 notify();return true;
}
function requireClient(){if(!client)throw new Error('Archivio online non configurato. Consulta la guida di installazione.');return client;}
function requireUser(){const u=cloudUser();if(!u)throw new Error('Accedi al tuo account per salvare nel cloud.');return u;}
export async function signIn(email,password){const {data,error}=await requireClient().auth.signInWithPassword({email,password});if(error)throw error;if(currentUser?.id!==(data?.user?.id||null)){currentUser=data?.user||null;notify();}return data;}
export async function signUp(email,password){const {data,error}=await requireClient().auth.signUp({email,password});if(error)throw error;if(currentUser?.id!==(data?.session?.user?.id||null)){currentUser=data?.session?.user||null;notify();}return data;}
export async function changePassword(password){const {error}=await requireClient().auth.updateUser({password});if(error)throw error;}
export async function signOut(){const {error}=await requireClient().auth.signOut();if(error)throw error;if(currentUser){currentUser=null;notify();}}
export async function resetPassword(email){const {error}=await requireClient().auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});if(error)throw error;}
export async function listCloudProjects(){const u=requireUser();const {data,error}=await requireClient().from('calendar_projects').select('payload,updated_at').eq('owner_id',u.id).order('updated_at',{ascending:false});if(error)throw error;return (data||[]).map(r=>r.payload).filter(Boolean);}
export async function getCloudProject(id){const u=requireUser();const {data,error}=await requireClient().from('calendar_projects').select('payload').eq('owner_id',u.id).eq('id',id).maybeSingle();if(error)throw error;return data?.payload||null;}
export async function putCloudProject(p){const u=requireUser();const {error}=await requireClient().from('calendar_projects').upsert({id:p.id,owner_id:u.id,name:p.name||'Calendario',payload:p,updated_at:new Date().toISOString()},{onConflict:'id'});if(error)throw error;}
export async function eraseCloudProject(id){const u=requireUser();const {error}=await requireClient().from('calendar_projects').delete().eq('owner_id',u.id).eq('id',id);if(error)throw error;}
