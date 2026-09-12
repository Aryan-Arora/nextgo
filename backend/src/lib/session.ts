import { createHash, randomBytes } from 'node:crypto';

export const hashSessionToken = (token: string) => createHash('sha256').update(token).digest('hex');
export const newSessionToken = () => randomBytes(32).toString('base64url');
