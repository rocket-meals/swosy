FROM directus/directus:10.11.2


# Switch to root user to install packages
USER root

# Install Git using apk
RUN apk update && \
    apk add git


# Switch back to the 'node' user for safety
USER node




USER root
RUN corepack enable
USER node

#RUN pnpm install directus-extension-auto-backup@10.8.5

RUN pnpm install directus-extension-auto-translation@10.11.6
RUN pnpm install directus-extension-sync@2.0.0
RUN pnpm install directus-extension-flow-manager@1.4.1
#RUN pnpm install directus-extension-schema-management-module@1.5.0

# RUN pnpm install directus-extension-package-name
