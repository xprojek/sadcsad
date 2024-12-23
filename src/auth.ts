import { Env, User, Session } from './types';
import config from './config.json';

export async function authenticateUser(env: Env, username: string, pin: string): Promise<Session | null> {
  const user = await env.readAkun.prepare(
    'SELECT * FROM users WHERE CAST(id AS INTEGER) = ? AND user = ? AND pin = ?'
  ).bind(config.defaultId, username, pin).first<User>();

  if (!user) return null;

  return {
    user: user.user,
    access: user.access,
    isAdmin: user.access === 'allemail',
    whitelist: user.whitelist ? user.whitelist.split(',').map(s => s.trim()) : [],
    blacklist: user.blacklist ? user.blacklist.split(',').map(s => s.trim()) : [],
    createdAt: Date.now()
  };
}

export function generateLoginPage(error?: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Login - RXmail</title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-100 min-h-screen flex items-center justify-center">
        <div class="max-w-md w-full mx-4">
            <div class="text-center mb-8">
                <h1 class="text-4xl font-bold text-gray-800">RXmail</h1>
                <p class="text-gray-600 mt-2">Sign in to your account</p>
            </div>
            
            <div class="bg-white rounded-lg shadow-lg p-8">
                ${error ? `
                    <div class="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
                        ${error}
                    </div>
                ` : ''}
                
                <form method="POST" action="/login">
                    <div class="mb-6">
                        <label class="block text-gray-700 text-sm font-bold mb-2" for="username">
                            Username
                        </label>
                        <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                               id="username"
                               name="username"
                               type="text"
                               required>
                    </div>
                    
                    <div class="mb-6">
                        <label class="block text-gray-700 text-sm font-bold mb-2" for="pin">
                            PIN
                        </label>
                        <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                               id="pin"
                               name="pin"
                               type="password"
                               required>
                    </div>
                    
                    <button class="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            type="submit">
                        Sign In
                    </button>
                </form>
            </div>
            
            <footer class="text-center mt-8 text-gray-600">
                2024 RXmail Inc.
            </footer>
        </div>
    </body>
    </html>
  `;
}