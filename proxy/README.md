# Server-Toplevel-Proxy

## About

When you want to deploy multiple services and you want them to be reached from outside but over http (port 80) this can be very frustrating to setup all redirects. This is where nginx-proxy suites perfect. This is a simple template and explanation.


## Configuration

- open ```.env``` and configure your host adress or leave it for development.

## Start

- Start the nginx-proxy with this ```docker-compose.yaml``` (```> docker-compose up```).


## Register your service. 

The proxy will listen on new added containers in the network.
If you want to add your container to the Proxy its very simple. You can also see an example in the folder: ```behindProxyTest```

An example for your ```docker-compose.yaml```
In this example our hostmachine is reachable at: ```192.168.178.35``` and we want reach our ```exampleService``` at the subroute ```/api```.
So a client can now reach our service with: ```http://192.168.178.35/api```

```
  exampleService:
    ...
    environment:
      - VIRTUAL_HOST=192.168.178.35
      - VIRTUAL_PATH=/api
    networks:
      - topDomainProxy


networks:
  topDomainProxy:
    external: true
```

If you want your service to get rid of the subdirectory (in this example /api), then you can also add: ```VIRTUAL_DEST=/``` so that your service gets the subdirectory removed. 

## Troubleshooting
`ERROR: The Compose file './docker-compose.yml' is invalid because:
networks.frontend value Additional properties are not allowed ('name' was unexpected)`

https://stackoverflow.com/questions/58155523/unable-to-give-network-name-in-docker-compose
curl -L https://github.com/docker/compose/releases/download/1.28.5/docker-compose-`uname -s`-`uname -m` -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose


## Documentation

This project is setup by following the tutorial from the original developers.

https://github.com/nginx-proxy/nginx-proxy
