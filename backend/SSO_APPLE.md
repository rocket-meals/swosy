
### Apple Sign In

Since it is a bit ugly with apple, here is a small tutorial:

! You will need an Apple Developer Account !
Followed partially tutorial from: Found from: https://sarunw.com/posts/sign-in-with-apple-4/

- 1. Find your Apple Team ID --> Variable TeamID
  - https://developer.apple.com/account/resources/identifiers/list
  - Top right corner, after your name like: "... - 6U99XXXXXX"
- 2. Create a new App ID
  - Visit Identifiers (https://developer.apple.com/account/resources/certificates/list)
  - Press on the "+" Button
  - Register a new App ID
  - Fill in a name and a Bundle ID
  - Activate "Sign in with Apple"
  - Save and Register
- 3. Create a Service ID (Configuration of the Return URL)
  - Visit Identifiers (https://developer.apple.com/account/resources/certificates/list)
  - Press top right on the search icon and search for "Service IDs"
  - Select one or create a new service ID
  - The name of the service will be our "AUTH_APPLE_CLIENT_ID"
  - Check "Sign in with Apple"
  - Click "Configure" (Sign in with Apple)
    - Select or create a primary App ID
    - Choose you Domain (example.com)
    - Enter the return URLs: "https://<PUBLIC_URL>/api/auth/login/apple/callback"
      - Replace <PUBLIC_URL> with your instance of your server
      - Continue --> Save
- Keys (https://developer.apple.com/account/resources/certificates/list)
  - Create a new key
  - Check "Sign in with Apple"
  - Click Configure (Sign in with Apple)
    - Select same primary App ID as before
  - Click Continue
  - Click Register
  - Save "Key ID", we will need this in a moment
  - Save File as we cannot download it again
  - Click Download and save file as: "key.txt"
- Secret Generation
  - Have the following Values: "TeamID", "AUTH_APPLE_CLIENT_ID", "KEY_ID", key.txt file
  - Create a small working folder and go into
  - Place `key.txt` into workfolder
  - Terminal: `gem install jwt` (install jwt with ruby)
  - Create a file `nano` `client_secret.rb` with content:
```
require 'jwt'

key_file = 'key.txt'
team_id = '<TEAM_ID>'
client_id = '<AUTH_APPLE_CLIENT_ID>'
key_id = '<KEY_ID>'

ecdsa_key = OpenSSL::PKey::EC.new IO.read key_file

headers = {
  'kid' => key_id
}

claims = {
        'iss' => team_id,
        'iat' => Time.now.to_i,
        'exp' => Time.now.to_i + 86400*180,
        'aud' => 'https://appleid.apple.com',
        'sub' => client_id,
}

token = JWT.encode claims, ecdsa_key, 'ES256', headers

puts token  
```
  - Replace the variables with the correct content from before
  - Execute the ruby file: `ruby client_secret.rb`
  - Copy the output --> This will be our AUTH_APPLE_CLIENT_SECRET
- Adapt docker-compose.yaml
  - Add `apple` to auth providers in the following `AUTH_PROVIDERS: "apple,google,facebook"` or only apple (line 89) ! Apple needs to be first due to terms & conditions
  - [Optional]: Create a default Role_ID for new users. In the following code it is in the comment how to add
  - Add to directus environment and replace variables with values:
```
      AUTH_APPLE_DRIVER: "openid"
      AUTH_APPLE_CLIENT_ID: "<AUTH_APPLE_CLIENT_ID>"
      AUTH_APPLE_CLIENT_SECRET: "<AUTH_APPLE_CLIENT_SECRET>"
      #AUTH_APPLE_DEFAULT_ROLE_ID: "${AUTH_STUDIP_DEFAULT_ROLE_ID}" #If you want to set a default role id
      AUTH_APPLE_SCOPE: "openid"
      AUTH_APPLE_IDENTIFIER_KEY: "sub"
      AUTH_APPLE_ALLOW_PUBLIC_REGISTRATION: "true"
      AUTH_APPLE_ISSUER_URL: "https://appleid.apple.com/.well-known/openid-configuration"
      AUTH_APPLE_ICON: "apple"
```
