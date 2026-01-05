const COMMON_PASSWORDS = [
  '123456',
  '123456789',
  'qwerty',
  'password',
  '12345',
  '12345678',
  '111111',
  '123123',
  'abc123',
  'password1',
  '1234',
  'iloveyou',
  '1q2w3e4r',
  '000000',
  'qwerty123',
  'zaq12wsx',
  'dragon',
  'sunshine',
  'princess',
  'letmein',
  'monkey',
  'football',
  'baseball',
  'welcome',
  'admin',
  'trustno1',
  'qazwsx',
  'password123',
  'qwertyuiop',
  'michael',
  'superman',
  'pokemon',
  'shadow',
  'killer',
  'zaq1zaq1',
  'mustang',
  'access',
  'starwars',
  'bailey',
  'passw0rd',
  'ashley',
  'buster',
  'nicole',
  'jessica',
  'lovely',
  'hottie',
  'flower',
  'whatever',
  'donald',
];

export function isCommonPassword(password: string): boolean {
  if (!password) return true;
  return COMMON_PASSWORDS.includes(password.toLowerCase());
}










