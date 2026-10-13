# Clerk OAuth for MCP connections

Use this reference when an MCP integration should let users connect by server
URL, sign in, and approve access without copying an OAuth client ID or secret.
This is separate from the PWA's existing Clerk-to-Convex JWT integration.

## Prefer CIMD for compatible clients

Client ID Metadata Documents (CIMD) identify a public OAuth client through an
HTTPS metadata URL. Clerk checks its declared callbacks; PKCE secures the
code exchange without a shared secret. Users still sign in and consent.

In the correct Clerk instance, open **OAuth applications → Settings → Client
onboarding** and enable **Publish CIMD support**. Choose the admission policy:
allow compatible clients for open onboarding, or pre-register the host's exact
metadata URL and restrict admission to pre-registered clients. For explicit
registration, use **Applications → Add application → Pre-register CIMD client**,
assign its scopes, and allow it. Keep a working Account Portal or consent page.

Configure the client permissions and default scopes for the app's operations.
For an itinerary app these might include `tripflow:read` and `tripflow:write`;
use the actual app's names. Create and advertise custom scopes for discovery,
and assign them where needed. Defaults apply only if a client omits `scope`.
Add identity scopes only when needed and account for refresh access.

Reconnect with OAuth and CIMD selected where offered, clearing the previously
supplied client ID and secret. Check that Clerk's discovery metadata advertises
`client_id_metadata_document_supported: true`. Older Clerk OAuth implementations
may require migration before CIMD is available.

[Clerk CIMD configuration](https://clerk.com/docs/guides/configure/auth-strategies/oauth/client-id-metadata-documents)

## DCR fallback

For a host that requires Dynamic Client Registration (DCR), enable **Publish
DCR support** in Clerk's Client onboarding settings and configure the allowed
and default scopes. Verify discovery exposes `registration_endpoint`. The
host obtains its client registration automatically; users do not copy credentials.
DCR exposes public client registration, so enable it for a concrete compatibility
need. Making a manually registered application **Public** removes its secret
requirement but still requires a client ID; it does not solve both requirements.

[Clerk OAuth and DCR settings](https://clerk.com/docs/guides/configure/auth-strategies/oauth/how-clerk-implements-oauth)

## Discovery, callbacks, and verification

Serve MCP protected-resource metadata advertising the intended Clerk issuer,
and make that issuer's OAuth discovery reachable. Verify PKCE `S256` and the
selected onboarding method against live metadata after saving settings.

For ChatGPT, use the exact callback and CIMD URL shown for the connection.
Issuer-identification support determines whether callbacks are stable or
connection-specific. For manually registered clients, register the exact
`redirect_uri` from the authorization request. Never assume a localhost,
Claude, or another ChatGPT connection's callback applies. Retry the connection
and verify sign-in, consent, and a scoped tool call end to end.

Keep OAuth token validation, tool scope checks, and Convex membership/ownership
checks. A Clerk OAuth token is not automatically a Convex `convex`-template JWT;
retain or implement the app's trusted server-side identity bridge. Keep server
secrets out of Vite variables, skill examples, and public plugin packages.
Do not copy real client credentials into this reference.

[OpenAI MCP authentication and callback rules](https://developers.openai.com/plugins/build/auth)
