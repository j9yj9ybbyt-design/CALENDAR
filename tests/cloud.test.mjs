import test from 'node:test';
import assert from 'node:assert/strict';
import {cloudConfigured} from '../js/cloud.js';

test('Cloud is disabled without setup, preventing accidental fake sync',()=>{
 globalThis.SMART_CALENDAR_CONFIG={supabaseUrl:'',supabaseAnonKey:''};
 assert.equal(cloudConfigured(),false);
});
test('Cloud requires https Supabase project URL and publishable key',()=>{
 globalThis.SMART_CALENDAR_CONFIG={supabaseUrl:'http://unsafe.supabase.co',supabaseAnonKey:'sb_publishable_example123'};
 assert.equal(cloudConfigured(),false);
 globalThis.SMART_CALENDAR_CONFIG={supabaseUrl:'https://example.supabase.co',supabaseAnonKey:'sb_publishable_example123'};
 assert.equal(cloudConfigured(),true);
});
