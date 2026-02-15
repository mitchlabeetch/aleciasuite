// packages/integrations/src/index.ts
// Alecia Suite — External Integrations Package
// Ported from convex/actions/microsoft.ts (~17k chars) and other integration files

export { pappers } from "./pappers";
export {
  createPipedriveClient,
  getPipedriveAuthUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  type PipedriveDeal,
  type PipedrivePerson,
  type PipedriveOrganization,
  type PipedriveClient,
  type DealsApi,
  type PersonsApi,
  type OrganizationsApi,
  type Configuration,
  type OAuth2Configuration,
} from "./pipedrive";
export { microsoft, createGraphClient } from "./microsoft";
export { google } from "./google";
