FROM directus/directus:10.10.7


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

RUN pnpm install directus-extension-auto-backup@10.8.5
RUN pnpm install directus-extension-auto-translation@10.8.4
RUN pnpm install directus-extension-schema-management-module
RUN pnpm install directus-extension-flow-manager
RUN pnpm install directus-extension-sync@1.1.2
# RUN pnpm install directus-extension-package-name
