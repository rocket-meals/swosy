# Sonar docker:S6471 (root user) reviewed: root is required because this container manages the Directus
# container through the host Docker socket mounted at /var/run/docker.sock (see apps/backend/docker-compose.yaml).
# Dockerfiles do not allow trailing comments, so this cannot carry an inline NOSONAR; mark it Safe in SonarCloud.
FROM node:22-bookworm

# Install basic tools, Docker CLI, openssl and xxd for Apple Token generation, then set up yarn
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl git openssl xxd \
    && curl -fsSL --proto '=https' --tlsv1.2 https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian bookworm stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null \
    && apt-get update \
    && apt-get install -y --no-install-recommends docker-ce-cli \
    && rm -rf /var/lib/apt/lists/* \
    && corepack enable \
    && corepack prepare yarn@stable --activate

# Set working directory
WORKDIR /rocket-meals

# Copy Yarn configuration and releases first
COPY .yarnrc.yml ./
COPY .yarn .yarn

# Copy package.json files for better Docker layer caching
COPY package.json yarn.lock ./
COPY apps/backend-sync/package.json ./apps/backend-sync/
COPY packages/common/package.json ./packages/common/
COPY packages/common-backend/package.json ./packages/common-backend/

# Install dependencies during build time - focused on backend-sync
RUN yarn workspaces focus backend-sync

# Copy only the necessary source files to keep the build context small
# Instead of `COPY . .` (which sends die komplette Repo), kopiere nur das, was für den build nötig ist.
COPY apps/backend-sync ./apps/backend-sync
COPY packages/common ./packages/common
COPY packages/common-backend ./packages/common-backend
COPY tsconfig.json ./tsconfig.json
COPY yarn.lock ./yarn.lock
COPY package.json ./package.json

# Copy only the directus-sync-data subdirectory from data folder
COPY data/directus-sync-data ./data/directus-sync-data

# Build/prepare the backend-sync application if needed
# (Currently just copying TypeScript files, but could add build step here)

# Set the working directory to backend-sync
WORKDIR /rocket-meals/apps/backend-sync

# Start the application directly with tsx
CMD ["yarn", "start:docker-manage"]
