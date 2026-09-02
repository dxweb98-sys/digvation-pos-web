import { readFile } from 'node:fs/promises';

const lock = JSON.parse(
  await readFile(new URL('../../contracts/contract-lock.json', import.meta.url), 'utf8'),
);

const expectedBackendSha = '484a652402e9d2e888ae60993b946bf3c21f4972';
const expectedSpecSha = '9008e605b96660b5183e937b1b15088d5f6faa27';

const errors = [];

if (lock.backend?.release !== 'digvation-pos-dev') {
  errors.push('backend.release must remain digvation-pos-dev');
}
if (lock.backend?.sha !== expectedBackendSha)
  errors.push('backend.sha does not match the accepted digvation-pos-dev baseline');
if (lock.auth?.specificationSha !== expectedSpecSha) {
  errors.push('auth.specificationSha does not match locked AUTH-01 specification');
}
if (lock.auth?.status !== 'development-integrated-accepted-for-frontend-integration') {
  errors.push('auth.status must record the accepted frontend-integration baseline');
}
if (lock.transport?.apiPrefix !== '/api/v1') errors.push('transport.apiPrefix must be /api/v1');
if (lock.transport?.openApiPath !== '/openapi.json') {
  errors.push('transport.openApiPath must be /openapi.json');
}

if (errors.length > 0) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exit(1);
}

console.log('Backend contract lock is valid.');
