FROM nginxproxy/nginx-proxy:dev

RUN { \
      echo 'client_max_body_size 200m;'; \
    } > /etc/nginx/conf.d/custom_proxy.conf
