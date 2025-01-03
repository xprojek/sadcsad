import { Env, User } from './types';
import config from './config.json';

export async function generateUserManagementPage(env: Env): Promise<string> {
  const users = await env.readAkun.prepare(
    'SELECT * FROM users WHERE CAST(id AS INTEGER) = ? AND access != ?'
  ).bind(config.defaultId, 'allemail').all<User>();

  return generateLayout('User Management', generateContent(users.results));
}

function generateContent(users: User[]): string {
  return `
    <body class="bg-gray-50 min-h-screen">
      <nav class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            <div class="flex items-center">
              <h1 class="text-2xl font-bold text-blue-600">RXmail</h1>
            </div>
            <div class="flex items-center space-x-4">
              <a href="/" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Back to Emails</a>
              <a href="/logout" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">Logout</a>
            </div>
          </div>
        </div>
      </nav>

      <div class="bg-white rounded-lg shadow-lg p-6 w-2/3 mx-auto mt-8">
        <h2 class="text-xl font-semibold mb-4">Create New User</h2>
        ${generateUserForm()}

        <h2 class="text-xl font-semibold mb-4 mt-8">Existing Users</h2>
        <div class="overflow-x-auto">
          ${generateUserTable(users)}
        </div>
      </div>
    </body>
  `;
}

function generateUserForm(): string {
  return `
    <form method="POST" action="/users/create" class="space-y-6" onsubmit="return validateForm(event)">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-gray-700 mb-2">Username</label>
          <input type="text" name="username" required class="w-full p-2 border rounded">
        </div>
        <div>
          <label class="block text-gray-700 mb-2">PIN</label>
          <input type="text" name="pin" required class="w-full p-2 border rounded">
        </div>
      </div>

      <div class="space-y-4">
        <label class="block text-gray-700 mb-3">Access Type</label>
        <div class="grid grid-cols-2 gap-4">
          <div 
            onclick="setAccessType('mailadmin')" 
            class="access-type-card cursor-pointer border-2 p-4 rounded-lg transition-all duration-300 ease-in-out hover:border-blue-500 hover:shadow-lg"
          >
            <input type="radio" name="accessType" value="mailadmin" checked class="hidden" id="mailadmin-radio">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-semibold text-gray-800">Mail Admin</h3>
                <p class="text-sm text-gray-600">Full email system access</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <div 
            onclick="setAccessType('custom')" 
            class="access-type-card cursor-pointer border-2 p-4 rounded-lg transition-all duration-300 ease-in-out hover:border-blue-500 hover:shadow-lg"
          >
            <input type="radio" name="accessType" value="custom" class="hidden" id="custom-radio">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-semibold text-gray-800">Custom Access</h3>
                <p class="text-sm text-gray-600">Limited email access</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              </svg>
            </div>
          </div>
        </div>

        <div id="access-input-container" class="mt-4" style="display: none;">
          <label class="block text-gray-700 mb-2">Access List</label>
          <input 
            type="text" 
            id="access" 
            name="access" 
            onkeyup="appendDomain(this)" 
            class="w-full p-2 border rounded"
            placeholder="Enter email addresses separated by spaces"
          >
          <p class="text-sm text-gray-500 mt-1">For custom access, enter email addresses separated by spaces</p>
        </div>
      </div>

<div class="space-y-4">
    <div class="flex space-x-4"> <!-- Added flex container for side-by-side layout -->
        <div class="flex-1"> <!-- Added flex-1 to allow equal width -->
            <label class="block text-gray-700 mb-2">Whitelist</label>
            <div class="flex space-x-2">
                <input type="text" id="whitelist" class="flex-1 p-2 border rounded">
                <button type="button" onclick="addListItem('whitelist')" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Add</button>
            </div>
            <div id="whitelist-display" class="mt-2"></div>
            <input type="hidden" id="whitelist-list" name="whitelist-list">
        </div>

        <div class="flex-1"> <!-- Added flex-1 to allow equal width -->
            <label class="block text-gray-700 mb-2">Blacklist</label>
            <div class="flex space-x-2">
                <input type="text" id="blacklist" class="flex-1 p-2 border rounded">
                <button type="button" onclick="addListItem('blacklist')" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Add</button>
            </div>
            <div id="blacklist-display" class="mt-2"></div>
            <input type="hidden" id="blacklist-list" name="blacklist-list">
        </div>
    </div>

    <button type="submit" class="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">Create User</button>
</div>
    </form>
  `;
}

function generateUserTable(users: User[]): string {
  if (!users || users.length === 0) {
    return `
      <div class="p-4 text-center text-gray-500">
        No users found
      </div>
    `;
  }

  return `
    <form id="delete-users-form" method="POST" action="/users/delete-multiple">
      <input type="hidden" id="selected-users" name="users">
      <table class="w-full">
        <thead>
          <tr class="bg-gray-50">
            <th class="px-4 py-2">
              <input 
                type="checkbox" 
                onchange="toggleAllUsers(this)" 
                class="form-checkbox h-5 w-5 text-blue-600"
              >
            </th>
            <th class="px-4 py-2 text-left">Username</th>
            <th class="px-4 py-2 text-left">PIN</th>
            <th class="px-4 py-2 text-left">Access</th>
            <th class="px-4 py-2 text-left">Whitelist</th>
            <th class="px-4 py-2 text-left">Blacklist</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          ${users.map(user => `
            <tr>
              <td class="px-4 py-2">
                <input 
                  type="checkbox" 
                  name="user" 
                  value="${user.user}" 
                  class="user-checkbox form-checkbox h-5 w-5 text-blue-600"
                >
              </td>
              <td class="px-4 py-2">${user.user}</td>
              <td class="px-4 py-2">${user.pin}</td>
              <td class="px-4 py-2">${user.access}</td>
              <td class="px-4 py-2">${user.whitelist || ''}</td>
              <td class="px-4 py-2">${user.blacklist || ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="mt-4">
        <button 
          type="button" 
          onclick="deleteSelectedUsers()" 
          class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Delete Selected Users
        </button>
      </div>
    </form>
  `;
}

function generateLayout(title: string, content: string): string {
  const scripts = generateScripts();
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - RXmail</title>
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Inter', sans-serif; }
      </style>
    </head>
    <body class="bg-gray-100">
        ${content}
      
      <footer class="p-4 text-center text-gray-600 mt-8">
        2024 RXmail Inc.
      </footer>

      <script>${scripts}</script>
    </body>
    </html>
  `;
}

function generateScripts(): string {
  return `
    function appendDomain(input) {
      const domain = '${config.defaultDomain}';
      const value = input.value;
      const words = value.split(' ');
      const lastWord = words[words.length - 1];

      if (lastWord.includes('@') && !lastWord.includes(domain)) {
        words[words.length - 1] = lastWord.split('@')[0] + domain + " ";
        input.value = words.join(' ');
      }
    }

    function setAccessType(type) {
      const mailadminCard = document.querySelector('.access-type-card:nth-child(1)');
      const customCard = document.querySelector('.access-type-card:nth-child(2)');
      const accessInputContainer = document.getElementById('access-input-container');
      const accessInput = document.getElementById('access');
      const mailadminRadio = document.getElementById('mailadmin-radio');
      const customRadio = document.getElementById('custom-radio');

      if (type === 'mailadmin') {
        mailadminCard.classList.add('border-blue-500', 'bg-blue-50');
        customCard.classList.remove('border-blue-500', 'bg-blue-50');
        accessInputContainer.style.display = 'none';
        accessInput.value = 'mailadmin';
        accessInput.readOnly = true;
        mailadminRadio.checked = true;
        customRadio.checked = false;
      } else {
        customCard.classList.add('border-blue-500', 'bg-blue-50');
        mailadminCard.classList.remove('border-blue-500', 'bg-blue-50');
        accessInputContainer.style.display = 'block';
        accessInput.value = '';
        accessInput.readOnly = false;
        customRadio.checked = true;
        mailadminRadio.checked = false;
      }
    }

    function addListItem(type) {
      const input = document.getElementById(type);
      const value = input.value.trim();
      if (!value) return;

      const list = document.getElementById(type + '-list');
      const items = list.value ? list.value.split(',').map(s => s.trim()) : [];

      if (!items.includes(value)) {
        items.push(value);
        list.value = items.join(', ');
        updateListDisplay(type);
      }

      input.value = '';
    }

    function removeListItem(type, item) {
      const list = document.getElementById(type + '-list');
      const items = list.value.split(',').map(s => s.trim()).filter(s => s !== item);
      list.value = items.join(', ');
      updateListDisplay(type);
    }

    function updateListDisplay(type) {
      const list = document.getElementById(type + '-list');
      const display = document.getElementById(type + '-display');
      const items = list.value ? list.value.split(',').map(s => s.trim()) : [];
      
      display.innerHTML = items.map(item => \`
        <span class="inline-flex items-center bg-blue-100 text-blue-800 rounded px-2 py-1 text-sm mr-2 mb-2">
          \${item}
          <button type="button" onclick="removeListItem('\${type}', '\${item}')" class="ml-1 text-blue-600 hover:text-blue-800">×</button>
        </span>
      \`).join('');
    }

    function toggleAllUsers(checkbox) {
      const userCheckboxes = document.querySelectorAll('.user-checkbox');
      userCheckboxes.forEach(cb => cb.checked = checkbox.checked);
    }

    function deleteSelectedUsers() {
      const selectedUsers = Array.from(document.querySelectorAll('.user-checkbox:checked'))
        .map(cb => cb.value);

      if (selectedUsers.length === 0) {
        alert('Please select users to delete');
        return;
      }

      if (confirm(\`Are you sure you want to delete \${selectedUsers.length} user(s)?\`)) {
        const form = document.getElementById('delete-users-form');
        const hiddenInput = document.getElementById('selected-users');
        hiddenInput.value = selectedUsers.join(',');
        form.submit();
      }
    }

    // Initialize with Mail Admin as default
    setAccessType('mailadmin');
  `;
}