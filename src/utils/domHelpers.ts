export function createTagElement(item: string, type: 'whitelist' | 'blacklist'): string {
  const bgColor = type === 'whitelist' ? 'blue' : 'red';
  return `<span class="inline-block bg-${bgColor}-100 text-${bgColor}-800 rounded px-2 py-1 text-sm mr-1 mb-1">
    ${item.trim()}
  </span>`;
}

export function createListItemElement(item: string, type: string): string {
    return `<span class="inline-flex items-center bg-blue-100 text-blue-800 rounded px-2 py-1 text-sm mr-2 mb-2">
      ${item}
      <button type="button" onclick="removeListItem('${type}', '${item}')" class="ml-1 text-blue-600 hover:text-blue-800">×</button>
    </span>`;
  }