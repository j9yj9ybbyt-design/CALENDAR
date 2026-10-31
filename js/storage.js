import {cloudUser,listCloudProjects,getCloudProject,putCloudProject,eraseCloudProject} from './cloud.js';
const DB='smart-calendar-web-v2', STORE='projects';
let dbPromise;
function db(){if(!('indexedDB' in globalThis))return Promise.reject(new Error('Il browser non supporta IndexedDB.'));if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{const req=indexedDB.open(DB,1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE,{keyPath:'id'});};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});return dbPromise;}
async function localList(){const d=await db();return new Promise((resolve,reject)=>{const req=d.transaction(STORE,'readonly').objectStore(STORE).getAll();req.onsuccess=()=>resolve((req.result||[]).sort((a,b)=>(b.updatedAt||'').localeCompare(a.updatedAt||'')));req.onerror=()=>reject(req.error);});}
async function localGet(id){const d=await db();return new Promise((resolve,reject)=>{const req=d.transaction(STORE,'readonly').objectStore(STORE).get(id);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
async function localSave(obj){const d=await db();return new Promise((resolve,reject)=>{const r=d.transaction(STORE,'readwrite').objectStore(STORE).put(structuredClone(obj));r.onsuccess=()=>resolve();r.onerror=()=>reject(r.error);});}
async function localDelete(id){const d=await db();return new Promise((resolve,reject)=>{const r=d.transaction(STORE,'readwrite').objectStore(STORE).delete(id);r.onsuccess=()=>resolve();r.onerror=()=>reject(r.error);});}
export const listLocalProjects=localList;
export async function listProjects(){return cloudUser()?listCloudProjects():localList();}
export async function getProject(id){return cloudUser()?getCloudProject(id):localGet(id);}
export async function saveProject(obj){return cloudUser()?putCloudProject(obj):localSave(obj);}
export async function deleteProject(id){return cloudUser()?eraseCloudProject(id):localDelete(id);}
