import { McpAccessHelper } from '../McpAccessHelper';

describe('McpAccessHelper', () => {
  it('builds the endpoint paths', () => {
    expect(McpAccessHelper.getEndpointPath(McpAccessHelper.ROUTE_PUBLIC_TOKEN)).toBe('/mcp-access/public-token');
    expect(McpAccessHelper.getEndpointPath(McpAccessHelper.ROUTE_MY_TOKEN)).toBe('/mcp-access/my-token');
  });

  it('appends /mcp to the backend url, with or without trailing slashes', () => {
    expect(McpAccessHelper.buildServerUrl('https://test.rocket-meals.de/rocket-meals/api')).toBe('https://test.rocket-meals.de/rocket-meals/api/mcp');
    expect(McpAccessHelper.buildServerUrl('https://test.rocket-meals.de/rocket-meals/api//')).toBe('https://test.rocket-meals.de/rocket-meals/api/mcp');
    expect(McpAccessHelper.buildServerUrl(' https://example.com ')).toBe('https://example.com/mcp');
  });

  it('puts the token into the url as access_token, url-encoded', () => {
    expect(McpAccessHelper.buildServerUrlWithToken('https://example.com/api', 'abc')).toBe('https://example.com/api/mcp?access_token=abc');
    expect(McpAccessHelper.buildServerUrlWithToken('https://example.com/api', 'a+b/c')).toBe('https://example.com/api/mcp?access_token=a%2Bb%2Fc');
  });

  it('builds the bearer header value', () => {
    expect(McpAccessHelper.buildAuthorizationHeaderValue('abc')).toBe('Bearer abc');
  });

  it('validates token responses', () => {
    expect(McpAccessHelper.isValidTokenResponse({ token: 'abc' })).toBe(true);
    expect(McpAccessHelper.isValidTokenResponse({ token: '' })).toBe(false);
    expect(McpAccessHelper.isValidTokenResponse({ token: 1 })).toBe(false);
    expect(McpAccessHelper.isValidTokenResponse(null)).toBe(false);
    expect(McpAccessHelper.isValidTokenResponse('abc')).toBe(false);
  });

  it('validates token status responses', () => {
    expect(McpAccessHelper.isValidTokenStatus({ has_token: false })).toBe(true);
    expect(McpAccessHelper.isValidTokenStatus({ has_token: true })).toBe(true);
    expect(McpAccessHelper.isValidTokenStatus({ has_token: 'yes' })).toBe(false);
    expect(McpAccessHelper.isValidTokenStatus(undefined)).toBe(false);
  });

  it('uses a reserved domain for the public user', () => {
    expect(McpAccessHelper.PUBLIC_USER_EMAIL).toMatch(/@mcp\.example\.com$/);
  });
});
