export function applyEmailFilters(subject: string, whitelist: string[], blacklist: string[]): boolean {
  // Jika tidak ada filter yang ditetapkan, izinkan semua email
  if (!whitelist.length && !blacklist.length) return true;

  // Ubah subject menjadi huruf kecil untuk pencocokan yang tidak sensitif terhadap huruf besar
  const lowerSubject = subject.toLowerCase();

  // Periksa blacklist terlebih dahulu - jika ada kata yang terdaftar di blacklist, tolak
  if (blacklist.length && blacklist.some(word => lowerSubject.includes(word.toLowerCase()))) {
    return false;
  }

  // Jika whitelist kosong, izinkan semua email yang tidak ada di blacklist
  if (!whitelist.length) return true;

  // Jika whitelist diatur, setidaknya satu kata harus cocok
  return whitelist.some(word => lowerSubject.includes(word.toLowerCase()));
}