import { Env, Session } from './types';
import { authenticateUser , generateLoginPage } from './auth';
import { generateUserManagementPage } from './userManagement';
import { generateEmailViewerPage, generateEmailContentPage } from './emailViewer';
import { getEmails, getTotalEmails, getEmailCounts } from './db/emailQueries';
import { applyEmailFilters } from './utils/emailFilters';
import config from './config.json';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const sessionCookie = request.headers.get('Cookie')?.match(/session=([^;]+)/)?.[1];
    let session: Session | null = null;

    if (sessionCookie) {
      try {
        session = JSON.parse(atob(sessionCookie));
      } catch (e) {
        // Invalid session cookie
      }
    }

    // Handle logout
    if (url.pathname === '/logout') {
      return new Response('', {
        status: 302,
        headers: {
          'Location': '/',
          'Set-Cookie': 'session=; HttpOnly; Path=/; Max-Age=0'
        }
      });
    }

    // Handle login
    if (url.pathname === '/login') {
      if (request.method === 'POST') {
        const formData = await request.formData();
        const username = formData.get('username')?.toString();
        const pin = formData.get('pin')?.toString();

        if (!username || !pin) {
          return new Response(generateLoginPage('Username and PIN are required'), {
            headers: { 'Content-Type': 'text/html' }
          });
        }

        session = await authenticateUser (env, username, pin);

        if (!session) {
          return new Response(generateLoginPage('Invalid username or PIN'), {
            headers: { 'Content-Type': 'text/html' }
          });
        }

        return new Response('', {
          status: 302,
          headers: {
            'Location': '/',
            'Set-Cookie': `session=${btoa(JSON.stringify(session))}; HttpOnly; Path=/; Max-Age=1200`
          }
        });
      }

      return new Response(generateLoginPage(), {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Require authentication for all other routes
    if (!session) {
      return new Response('', {
        status: 302,
        headers: { 'Location': '/login' }
      });
    }

    // Handle user management (admin only)
    if (url.pathname === '/users') {
      if (!session.isAdmin) {
        return new Response('Unauthorized', { status: 403 });
      }

      if (request.method === 'GET') {
        const html = await generateUserManagementPage(env);
        return new Response(html, {
          headers: { 'Content-Type': 'text/html' }
        });
      }
    }

    // Handle user creation (admin only)
    if (url.pathname === '/users/create' && request.method === 'POST') {
      if (!session.isAdmin) {
        return new Response('Unauthorized', { status: 403 });
      }

      const formData = await request.formData();
      const username = formData.get('username')?.toString();
      const pin = formData.get('pin')?.toString();
      const access = formData.get('access')?.toString();
      
      // Get whitelist and blacklist from form data
      const whitelist = formData.get('whitelist-list')?.toString().trim() || '';
      const blacklist = formData.get('blacklist-list')?.toString().trim() || '';

      console.log('Creating user with:', {
        username,
        pin,
        access,
        whitelist,
        blacklist
      });

      if (username && pin && access) {
        try {
          await env.readAkun.prepare(
            'INSERT INTO users (id, user, pin, access, whitelist, blacklist) VALUES (CAST(? AS INTEGER), ?, ?, ?, ?, ?)'
          ).bind(config.defaultId, username, pin, access, whitelist, blacklist).run();

          console.log('User  created successfully');
        } catch (error) {
          console.error('Error creating user:', error);
        }
      } else {
        console.log('Missing required fields for user creation');
      }

      return new Response('', {
        status: 302,
        headers: { 'Location': '/users' }
      });
    }

    // Handle user deletion (admin only)
    if (url.pathname === '/users/delete ' && request.method === 'POST') {
      if (!session.isAdmin) {
        return new Response('Unauthorized', { status: 403 });
      }

      const formData = await request.formData();
      const username = formData.get('username')?.toString();

      if (username) {
        await env.readAkun.prepare(
          'DELETE FROM users WHERE CAST(id AS INTEGER) = ? AND user = ? AND access != ?'
        ).bind(config.defaultId, username, 'allemail').run();
      }

      return new Response('', {
        status: 302,
        headers: { 'Location': '/users' }
      });
    }

    // Handle multiple user deletion (admin only)
if (url.pathname === '/users/delete-multiple' && request.method === 'POST') {
  if (!session.isAdmin) {
    return new Response('Unauthorized', { status: 403 });
  }

  const formData = await request.formData();
  const usersToDelete = formData.get('users')?.toString().split(',');

  if (usersToDelete && usersToDelete.length > 0) {
    const placeholders = usersToDelete.map(() => '?').join(',');
    await env.readAkun.prepare(
      `DELETE FROM users WHERE CAST(id AS INTEGER) = ? AND user IN (${placeholders}) AND access != ?`
    ).bind(config.defaultId, ...usersToDelete, 'allemail').run();
  }

  return new Response('', {
    status: 302,
    headers: { 'Location': '/users' }
  });
}

    // Handle email content view
    if (url.pathname.startsWith('/view/')) {
      const emailId = url.pathname.split('/')[2];
      const email = await env.readDB.prepare(
        'SELECT * FROM emails WHERE id = ?'
      ).bind(emailId).first();

      if (!email) {
        return new Response('Email not found', { status: 404 });
      }

      // Log session access and email address for debugging
      console.log('Session Access:', session.access);
      console.log('Email To Address:', email.to_address);

      // Check access permission and apply filters
      if (!session.isAdmin) {
        const allowedEmails = session.access.split(' ');

        // Allow access if the user has 'allemail' access or is an admin
        if (!allowedEmails.includes(email.to_address) && !allowedEmails.includes('allemail') && session.access !== 'mailadmin') {
          console.log('Unauthorized access attempt:', email.to_address);
          return new Response('Unauthorized', { status: 403 });
        }

        // Apply whitelist/blacklist filters
        if (!applyEmailFilters(email.subject || '', session.whitelist, session.blacklist)) {
          console.log('Email filtered:', email.subject);
          return new Response('Email filtered', { status: 403 });
        }
      }

      return new Response(generateEmailContentPage(email), {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Handle main email list
    const page = parseInt(url.searchParams.get('page') || '1');
    const selectedEmail = url.searchParams.get('email') || undefined;

    const [emails, totalEmails, emailCounts] = await Promise.all([
      getEmails(env, session, page, selectedEmail),
      getTotalEmails(env, session, selectedEmail),
      getEmailCounts(env, session)
    ]);

    // Filter emails based on whitelist/blacklist
    const filteredEmails = emails.filter(email => 
      applyEmailFilters(email.subject || '', session.whitelist, session.blacklist)
    );

    const perPage = 10;
    const totalPages = Math.ceil(totalEmails / perPage);

    return new Response(
      generateEmailViewerPage(filteredEmails, page, totalPages, session, emailCounts, selectedEmail),
      { headers: { 'Content-Type': 'text/html' } }
    );
  },
};