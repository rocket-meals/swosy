FROM directus/directus:11.9.3


# Switch to root user to install packages
USER root

# Install Git and required dependencies for Puppeteer using apk
RUN apk update && apk add --no-cache \
    ca-certificates \
    chromium \
    curl \
    dbus \
    freetype \
    git \
    harfbuzz \
    nss \
    ttf-freefont \
    udev

# openssl # Apple Token generation# Apple Token generation
# xxd # Apple Token generation

# Set environment variables for Puppeteer
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Switch back to the 'node' user for safety
USER node

USER root
RUN corepack enable
USER node

RUN corepack enable && \
    corepack prepare pnpm@8.6.12 --activate && \
    pnpm install --ignore-scripts directus-extension-sync@3.0.3 && \
    pnpm install --ignore-scripts directus-extension-flow-manager@1.4.1