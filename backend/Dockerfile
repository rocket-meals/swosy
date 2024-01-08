FROM directus/directus:10.8.3


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

RUN pnpm install simple-git

RUN pnpm install axios
RUN pnpm install directus-cut
RUN pnpm install directus-extension-auto-backup@10.8.5
RUN pnpm install directus-extension-auto-translation@10.8.4
RUN pnpm install moment
RUN pnpm install deepl-node
RUN pnpm install jssoup
# RUN pnpm install directus-extension-package-name
