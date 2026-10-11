# dockerDatabaseRestore/Dockerfile

# Sonar docker:S6471 (root user) reviewed: one-shot restore container (compose profile "restore") that must read
# backup files from the host bind mount /dump regardless of their host ownership. It only talks to the database
# over the network. Dockerfiles do not allow trailing comments, so this cannot carry an inline NOSONAR; mark it Safe in SonarCloud.
FROM postgis/postgis:13-master

# Copy a restore script into the container
COPY restore.sh /usr/local/bin/restore.sh

# Make the script executable
RUN chmod +x /usr/local/bin/restore.sh

# Default command to run the restore script
CMD ["/usr/local/bin/restore.sh"]
