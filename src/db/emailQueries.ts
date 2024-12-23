import { Email, EmailCount } from '../types';
import { Env } from '../types';
import { applyEmailFilters } from '../utils/emailFilters';
import LRU from 'lru-cache';

// Cache email counts menggunakan LRU
const countCache = new LRU<string, {count: number, timestamp: number}>({
  max: 100, // Batasi jumlah item cache
  maxAge: 30000 // 30 detik
});

const CACHE_TTL = 30000; // 30 seconds

export async function getEmails(env: Env, session: { isAdmin: boolean, access: string, whitelist?: string[], blacklist?: string[] }, page: number, selectedEmail?: string): Promise<Email[]> {
  const startTime = Date.now();

  // Validasi input
  if (page < 1) {
    throw new Error('Invalid page number');
  }

  const perPage = 10;
  const offset = (page - 1) * perPage;

  try {
    let query = 'SELECT * FROM emails';
    const params: any[] = [];
    const conditions: string[] = [];

    // Handle access levels
    if (session.access !== 'mailadmin' && session.access !== 'allemail') {
      const allowedEmails = session.access.split(' ');
      if (allowedEmails.length > 0) {
        conditions.push(`to_address IN (${allowedEmails.map(() => '?').join(',')})`);
        params.push(...allowedEmails);
      }
    }

    // Apply email filter
    if (selectedEmail) {
      conditions.push('to_address = ?');
      params.push(selectedEmail);
    }

    // Apply conditions
    if (conditions.length) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // Add pagination
    query += ' ORDER BY received_at DESC LIMIT ? OFFSET ?';
    params.push(perPage, offset);

    // Eksekusi query dengan error handling
    const result = await env.readDB.prepare(query).bind(...params).all();

    // If no results and the user has no specific access restrictions, return all emails
    if (result.results.length === 0 && (session.access === 'mailadmin' || session.access === 'allemail')) {
      // Reset the query to get all emails
      query = 'SELECT * FROM emails ORDER BY received_at DESC LIMIT ? OFFSET ?';
      const allParams = [perPage, offset];
      const allResult = await env.readDB.prepare(query).bind(...allParams).all();
      
      // Log performa
      logPerformance('getEmails', startTime);
      
      return allResult.results;
    }

    // Filter results based on whitelist and blacklist
    const filteredEmails = result.results.filter(email => 
      applyEmailFilters(email.subject || '', session.whitelist, session.blacklist)
    );

    // Log performa
    logPerformance('getEmails', startTime);

    return filteredEmails;
  } catch (error) {
    console.error('Error fetching emails:', error);
    throw new Error('Failed to retrieve emails');
  }
}

// Performance logging function
function logPerformance(functionName: string, startTime: number) {
  const duration = Date.now() - startTime;
  if (duration > 100) { // Log jika lebih dari 100ms
    console.warn(`${functionName} took ${duration}ms`);
  }
}

export async function getTotalEmails(env: Env, session: { access: string }, selectedEmail?: string): Promise<number> {
  const cacheKey = `${session.access}-${selectedEmail || 'all'}`;
  const cached = countCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.count;
  }

  let query = 'SELECT COUNT(*) as total FROM emails';
  const params: any[] = [];
  const conditions: string[] = [];

  if (session.access !== 'mailadmin' && session.access !== 'allemail') {
    const allowedEmails = session.access.split(' ');
    conditions.push(`to_address IN (${allowedEmails.map(() => '?').join(',')})`);
    params.push(...allowedEmails);
  }

  if (selectedEmail) {
    conditions.push('to_address = ?');
    params.push(selectedEmail);
  }

  if (conditions.length) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  const result = await env.readDB.prepare(query).bind(...params).first();
  const count = result?.total || 0;
  
  countCache.set(cacheKey, { count, timestamp: Date.now() });
  return count;
}

export async function getEmailCounts(env: Env, session: { access: string }): Promise<Record<string, number>> {
  const counts: Record<string, number> = { 'All Emails': 0 };
  
  try {
    // Get total count first
    counts['All Emails'] = await getTotalEmails(env, session);

    // Untuk admin/mailadmin, dapatkan semua alamat email unik
    if (session.access === 'mailadmin' || session.access === 'allemail') {
      const emails = (await env.readDB.prepare('SELECT DISTINCT to_address FROM emails').all()).results;
      
      // Gunakan Promise.all untuk kueri konkuren
      const emailCounts = await Promise.all(
        emails.map(async ({ to_address }) => ({
          email: to_address,
          count: await getTotalEmails(env, session, to_address)
        }))
      );

      emailCounts.forEach(({ email, count }) => {
        counts[email] = count;
      });
    } else {
      // Untuk pengguna biasa, hanya hitung email yang diizinkan
      const allowedEmails = session.access.split(' ');
      const emailCounts = await Promise.all(
        allowedEmails.map(async (email) => ({
          email,
          count: await getTotalEmails(env, session, email)
        }))
      );

      emailCounts.forEach(({ email, count }) => {
        counts[email] = count;
      });
    }

    return counts;
  } catch (error) {
    console.error('Error in getEmailCounts:', error);
    throw new Error('Failed to retrieve email counts');
  }
}