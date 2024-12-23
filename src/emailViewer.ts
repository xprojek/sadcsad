import { Email, Session } from './types';

export function generateEmailViewerPage(emails: Email[], page: number, totalPages: number, session: Session, emailCounts: Record<string, number>, selectedEmail?: string): string {
  const allowedEmails = session.isAdmin ? ['All Emails'] : ['All Emails', ...session.access.split(' ')];
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>RXmail</title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
            body { font-family: 'Inter', sans-serif; }
            .email-card { transition: transform 0.2s, box-shadow 0.2s; }
            .email-card:hover { transform: translateY(-2px); }
            .custom-scrollbar::-webkit-scrollbar { width: 8px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #888; border-radius: 4px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #666; }
        </style>
    </head>
    <body class="bg-gray-50 min-h-screen">
        <nav class="bg-white shadow-sm border-b border-gray-200">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center h-16">
                    <div class="flex items-center">
                        <h1 class="text-2xl font-bold text-blue-600">RXmail</h1>
                    </div>
                    <div class="flex items-center space-x-4">
                        <select
                            onchange="window.location.href='/?email=' + this.value"
                            class="bg-white border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                            ${allowedEmails.map(email => `
                                <option value="${email === 'All Emails' ? '' : email}" ${selectedEmail === email ? 'selected' : ''}>
                                    ${email} ${emailCounts[email] ? `(${emailCounts[email]})` : ''}
                                </option>
                            `).join('')}
                        </select>
                        ${session.isAdmin ? `
                            <a href="/users" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                Manage Users
                            </a>
                        ` : ''}
                        <a href="/logout" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                            Logout
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div class="space-y-4">
                ${emails.map(email => `
                    <div class="email-card bg-white rounded-lg shadow-sm hover:shadow-md p-6">
                        <div class="flex flex-col md:flex-row md:items-center md:justify-between">
                            <div class="flex-1">
                                <div class="flex items-center space-x-2">
                                    <h2 class="text-lg font-semibold text-gray-900">${email.subject || '(No Subject)'}</h2>
                                    <span class="text-xs px-2 py-1 rounded-full ${email.html_content ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                                        ${email.html_content ? 'HTML' : 'Text'}
                                    </span>
                                </div>
                                <div class="mt-2 space-y-1">
                                    <p class="text-sm text-gray-600">From: <span class="font-medium">${email.from_address}</span></p>
                                    <p class="text-sm text-gray-600">To: <span class="font-medium">${email.to_address}</span></p>
                                    <p class="text-sm text-gray-500">${new Date(email.received_at).toLocaleString()}</p>
                                </div>
                                ${email.text_content ? `
                                    <div class="mt-3 text-sm text-gray-600 line-clamp-2">
                                        ${email.text_content.substring(0, 200)}${email.text_content.length > 200 ? '...' : ''}
                                    </div>
                                ` : ''}
                            </div>
                            <button onclick="openEmailContent(${email.id})"
                                    class="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                View Email
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="mt-8 flex justify-between items-center">
                <div class="flex-1 flex justify-between sm:hidden">
                    ${page > 1 ? `
                        <a href="?page=${page - 1}${selectedEmail ? `&email=${selectedEmail}` : ''}"
                            class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                            Previous
                        </a>
                    ` : '<div></div>'}
                    ${page < totalPages ? `
                        <a href="?page=${page + 1}${selectedEmail ? `&email=${selectedEmail}` : ''}"
                            class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                            Next
                        </a>
                    ` : '<div></div>'}
                </div>
                <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                        <p class="text-sm text-gray-700">
                            Showing page <span class="font-medium">${page}</span> of <span class="font-medium">${totalPages}</span>
                        </p>
                    </div>
                    <div>
                        <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            ${page > 1 ? `
                                <a href="?page=${page - 1}${selectedEmail ? `&email=${selectedEmail}` : ''}"
                                    class="relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                                    Previous
                                </a>
                            ` : ''}
                            ${page < totalPages ? `
                                <a href="?page=${page + 1}${selectedEmail ? `&email=${selectedEmail}` : ''}"
                                    class="relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                                    Next
                                </a>
                            ` : ''}
                        </nav>
                    </div>
                </div>
            </div>
        </main>

        <footer class="bg-white border-t border-gray-200 mt-8">
            <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <p class="text-center text-sm text-gray-500">
                    © 2024 RXmail Inc. All rights reserved.
                </p>
            </div>
        </footer>

        <script>
            function openEmailContent(id) {
                const width = Math.min(1000, window.innerWidth * 0.9);
                const height = Math.min(800, window.innerHeight * 0.9);
                const left = (window.innerWidth - width) / 2;
                const top = (window.innerHeight - height) / 2;
                
                window.open(
                    '/view/' + id,
                    'EmailContent',
                    \`width=\${width},height=\${height},left=\${left},top=\${top},scrollbars=yes\`
                );
            }
        </script>
    </body>
    </html>
  `;
}

export function generateEmailContentPage(email: Email): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${email.subject || '(No Subject)'} - RXmail</title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
            body { font-family: 'Inter', sans-serif; }
            .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #888 #f1f1f1; }
            .custom-scrollbar::-webkit-scrollbar { width: 8px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #888; border-radius: 4px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #666; }
        </style>
    </head>
    <body class="bg-gray-50 min-h-screen custom-scrollbar">
        <div class="max-w-4xl mx-auto px-4 py-8">
            <div class="bg-white rounded-lg shadow-lg overflow-hidden">
                <div class="border-b border-gray-200 px-6 py-4">
                    <div class="flex justify-between items-center">
                        <div class="flex items-center space-x-4">
                            <h1 class="text-xl font-semibold text-blue-600">RXmail</h1>
                            <div class="h-6 w-px bg-gray-300"></div>
                            <h2 class="text-lg font-medium text-gray-900">${email.subject || '(No Subject)'}</h2>
                        </div>
                        <button onclick="window.close()"
                                class="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                            Close
                        </button>
                    </div>
                </div>

                <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div class="grid grid-cols-1 gap-2 text-sm">
                        <div class="flex items-center">
                            <span class="text-gray-500 w-20">From:</span>
                            <span class="text-gray-900 font-medium">${email.from_address}</span>
                        </div>
                        <div class="flex items-center">
                            <span class="text-gray-500 w-20">To:</span>
                            <span class="text-gray-900 font-medium">${email.to_address}</span>
                        </div>
                        <div class="flex items-center">
                            <span class="text-gray-500 w-20">Date:</span>
                            <span class="text-gray-900">${new Date(email.received_at).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div class="px-6 py-4">
                    ${email.html_content ? `
                        <div class="prose max-w-none">
                            ${email.html_content}
                        </div>
                    ` : ''}

                    ${email.text_content ? `
                        <div class="mt-6">
                            <h3 class="text-sm font-medium text-gray-900 mb-2">Plain Text Content:</h3>
                            <pre class="whitespace-pre-wrap text-sm text-gray-600 bg-gray-50 rounded-lg p-4 border border-gray-200">
                                ${email.text_content}
                            </pre>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
}