function appendDomain(input) {
  const domain = '${config.defaultDomain}';
  const value = input.value;
  const words = value.split(' ');
  const lastWord = words[words.length - 1];

  if (lastWord.includes('@') && !lastWord.includes(domain)) {
    words[words.length - 1] = lastWord.split('@')[0] + domain;
    input.value = words.join(' ');
  }
}

function setAccessType(type) {
  const accessInput = document.getElementById('access');
  if (type === 'mailadmin') {
    accessInput.value = 'mailadmin';
    accessInput.readOnly = true;
  } else {
    accessInput.value = '';
    accessInput.readOnly = false;
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
    list.value = items.join(', '); // Update the hidden input
    updateListDisplay(type);
  }

  input.value = ''; // Clear the input field
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

function handleListInputKey(event, type) {
  if (event.key === 'Enter') {
    event.preventDefault();
    addListItem(type);
  }
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
