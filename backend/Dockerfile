FROM oven/bun

WORKDIR /app

# Install OpenSSL for Prisma and PostgreSQL 16 client tools for backup
RUN apt-get update -y && apt-get install -y openssl wget ca-certificates gnupg
RUN wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
RUN echo "deb http://apt.postgresql.org/pub/repos/apt/ bookworm-pgdg main" > /etc/apt/sources.list.d/pgdg.list
RUN apt-get update -y && apt-get install -y postgresql-client-16

# Copy package files
COPY package.json .
COPY bun.lock .

# Install dependencies
RUN bun install 

# Copy source code
COPY src src
COPY tsconfig.json .

# Copy Prisma schema and files
COPY prisma prisma

# Generate Prisma client
RUN bunx prisma generate

# Expose API port
EXPOSE 4000

# Start the application
CMD ["bun", "src/index.ts"]