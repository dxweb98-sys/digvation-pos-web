import { setupServer, type SetupServerApi } from 'msw/node';

export function createMockServer(): SetupServerApi {
  return setupServer();
}
