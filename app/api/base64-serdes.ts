// Convert Base64 to Base64URL
export function toBase64Url(base64: string) {
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Convert Base64URL to Base64
export function fromBase64Url(base64url: string) {
  let base64 = base64url
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  // Add padding if needed
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }

  return base64;
}