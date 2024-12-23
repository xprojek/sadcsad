import { User } from '../types';
// import { createTagElement } from '../utils/domHelpers

function createTagElement(item: string, type: 'whitelist' | 'blacklist'): string {
  const bgColor = type === 'whitelist' ? 'blue' : 'red';
  return `<span class="inline-block bg-${bgColor}-100 text-${bgColor}-800 rounded px-2 py-1 text-sm mr-1 mb-1">
    ${item.trim()}
  </span>`;
}

export function generateUserForm(): string {
  return `
    <form method="POST" action="/users/create" class="space-y-6">
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
        <label class="block text-gray-700">Access Type</label>
        <div class="flex space-x-4">
          <label class="inline-flex items-center">
            <input type="radio" name="accessType" value="mailadmin" onclick="setAccessType('mailadmin')" class="form-radio">
            <span class="ml-2">Mail Admin</span>
          </label>
          <label class="inline-flex items-center">
            <input type="radio" name="accessType" value="custom" onclick="setAccessType('custom')" checked class="form-radio">
            <span class="ml-2">Custom Access</span>
          </label>
        </div>
        
        <div>
          <label class="block text-gray-700 mb-2">Access List</label>
          <input type="text" id="access" name="access" required onkeyup="appendDomain(this)" class="w-full p-2 border rounded">
          <p class="text-sm text-gray-500 mt-1">For custom access, enter email addresses separated by spaces</p>
        </div>
      </div>

      <div class="space-y-4">
<div>
    <label class="block text-gray-700 mb-2">Whitelist</label>
    <div class="flex space-x-2">
        <input type="text" id="whitelist" class="flex-1 p-2 border rounded">
        <button type="button" onclick="addListItem('whitelist')" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Add</button>
    </div>
    <div id="whitelist-display" class="mt-2"></div>
    <input type="hidden" id="whitelist-list" name="whitelist"> <!-- Pastikan ini ada -->
</div>
<div>
    <label class="block text-gray-700 mb-2">Blacklist</label>
    <div class="flex space-x-2">
        <input type="text" id="blacklist" class="flex-1 p-2 border rounded">
        <button type="button" onclick="addListItem('blacklist')" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Add</button>
    </div>
    <div id="blacklist-display" class="mt-2"></div>
    <input type="hidden" id="blacklist-list" name="blacklist"> <!-- Pastikan ini ada -->
</div>

      <button type="submit" class="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">Create User</button>
    </form>
  `;
}

export function generateUserTable(users: User[]): string {
  return `
    <table class="w-full">
      <thead>
        <tr class="bg-gray-50">
          <th class="px-4 py-2 text-left">Username</th>
          <th class="px-4 py-2 text-left">PIN</th>
          <th class="px-4 py-2 text-left">Access</th>
          <th class="px-4 py-2 text-left">Whitelist</th>
          <th class="px-4 py-2 text-left">Blacklist</th>
          <th class="px-4 py-2 text-left">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        ${users.map(user => `
          <tr>
            <td class="px-4 py-2">${user.user}</td>
            <td class="px-4 py-2">${user.pin}</td>
            <td class="px-4 py-2">${user.access}</td>
            <td class="px-4 py-2">
              ${user.whitelist ? user.whitelist.split(',').map(item => createTagElement(item, 'whitelist')).join('') : ''}
            </td>
            <td class="px-4 py-2">
              ${user.blacklist ? user.blacklist.split(',').map(item => createTagElement(item, 'blacklist')).join('') : ''}
            </td>
            <td class="px-4 py-2">
              <form method="POST" action="/users/delete" class="inline">
                <input type="hidden" name="username" value="${user.user}">
                <button type="submit" class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Delete</button>
              </form>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}