FROM directus/directus:11.3.5


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

RUN corepack enable && \
    corepack prepare pnpm@8.6.12 --activate

RUN pnpm install directus-extension-sync@3.0.3

RUN pnpm install directus-extension-flow-manager@1.4.1
#RUN pnpm install directus-extension-schema-management-module@1.5.0

# RUN pnpm install directus-extension-package-name