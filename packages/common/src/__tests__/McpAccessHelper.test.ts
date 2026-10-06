import { McpAccessHelper } from '../McpAccessHelper';

describe('McpAccessHelper', () => {
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

  it('asks Directus for a random string of the personal token length', () => {
    expect(McpAccessHelper.buildRandomStringPath()).toBe('/utils/random/string?length=64');
    expect(McpAccessHelper.buildRandomStringPath(32)).toBe('/utils/random/string?length=32');
  });

  it('reads the random string from the Directus response', () => {
    expect(McpAccessHelper.parseRandomStringResponse({ data: 'abc' })).toBe('abc');
    expect(McpAccessHelper.parseRandomStringResponse({ data: '' })).toBeNull();
    expect(McpAccessHelper.parseRandomStringResponse({ data: 1 })).toBeNull();
    expect(McpAccessHelper.parseRandomStringResponse(null)).toBeNull();
    expect(McpAccessHelper.parseRandomStringResponse('abc')).toBeNull();
  });

  it('detects a set token in the concealed users/me response', () => {
    expect(McpAccessHelper.hasTokenInOwnUserResponse({ data: { token: '**********' } })).toBe(true);
    expect(McpAccessHelper.hasTokenInOwnUserResponse({ data: { token: null } })).toBe(false);
    expect(McpAccessHelper.hasTokenInOwnUserResponse({ data: {} })).toBe(false);
    expect(McpAccessHelper.hasTokenInOwnUserResponse({ data: null })).toBe(false);
    expect(McpAccessHelper.hasTokenInOwnUserResponse(undefined)).toBe(false);
  });

  it('uses the same fixed token for the public user on every server', () => {
    expect(McpAccessHelper.PUBLIC_USER_TOKEN).toBe('PUBLIC-TOKEN');
  });

  it('uses a reserved domain for the public user', () => {
    expect(McpAccessHelper.PUBLIC_USER_EMAIL).toMatch(/@mcp\.example\.com$/);
  });
});
