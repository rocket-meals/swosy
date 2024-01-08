# RocketMeals

# Informations

- Color: #EE581F

## Setup

- nvm version 16 (v16.20.2)
	- use nvm
- jdk 15 (for Android build)

- in `./app` run `npm install`

### Start

- in `./app` run `npm run web`
- in `./app` run `npm run ios`
- in `./app` run `npm run android`

#### Troubleshsooting

- EMFILE: too many open files, watch
	- install watchman



### Native Mobile App

In order to use the login system with SSO, we need to configure the deep linking.
- Deeplinking: https://reactnavigation.org/docs/deep-linking/
- MealCard ios: ```npx uri-scheme add myapp --ios```
- MealCard android: ```npx uri-scheme add myapp --android```
- configure in: `app/app.config.js` the deeplink

## Docker-Compose
- Install and configure a proxy to route requests your docker-instance (for example with https://github.com/FireboltCasters/Server-Toplevel-Proxy)
- Run ```docker-compose up --build```
- After that you can simple start and stop with ```docker-compose up``` and ```docker-compose down```


## Map (Leaflet)

Follow this guide: https://github.com/Dean177/expo-leaflet/blob/master/expo-leaflet/readme.md


## Ads
Please read the AD_README.md
