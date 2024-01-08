
### Apple Sign In

Since it is a bit ugly with apple, here is a small tutorial:

! You will need an Apple Developer Account !
Followed partially tutorial from: Found from: https://sarunw.com/posts/sign-in-with-apple-4/

- Find your Apple Team ID --> THIS will be our 
- Go to Identifiers menu in Certificates, Identifiers & Profiles (https://developer.apple.com/account/resources/certificates/list)
- Identifiers (https://developer.apple.com/account/resources/certificates/list)
  - Create new --> Services IDs
    - Choose an Identifier --> THIS will be our AUTH_APPLE_CLIENT_ID
    - Register
  - Open the created Identifier
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
