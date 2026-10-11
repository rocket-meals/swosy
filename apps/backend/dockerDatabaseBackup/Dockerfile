# Use ARG to allow dynamic versioning
ARG POSTGIS_VERSION=13-master

# Base the image on the specific version of PostGIS
FROM postgis/postgis:${POSTGIS_VERSION}

# Maintainer info
LABEL maintainer="Your Name <your.email@example.com>"

# Install cron. It comes from the Debian repositories, the PostgreSQL apt repository the base image
# ships (/etc/apt/sources.list.d/pgdg.list) is not needed for it. For Debian bullseye that repository
# was moved to apt-archive.postgresql.org and now answers 404, which makes apt-get update fail.
# So every source pointing to apt.postgresql.org is dropped first. PostgreSQL itself is already installed.
RUN grep -l "apt.postgresql.org" /etc/apt/sources.list.d/* 2>/dev/null | xargs -r rm -f && \
    apt-get update && \
    apt-get install -y --no-install-recommends cron && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Add the backup scripts to the container
COPY dump.sh /dump.sh
RUN chmod +x /dump.sh

COPY start.sh /start.sh
RUN chmod +x /start.sh

# Set the volume for storing dumps
VOLUME /dump

# Set the entrypoint to the start script
ENTRYPOINT ["/start.sh"]
CMD [""]
