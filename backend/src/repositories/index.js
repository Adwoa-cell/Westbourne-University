import { env } from '../config/env.js';
import { demoRepository } from './demoRepository.js';
import { supabaseRepository } from './supabaseRepository.js';

export const repository = env.dataSource === 'supabase' ? supabaseRepository : demoRepository;
