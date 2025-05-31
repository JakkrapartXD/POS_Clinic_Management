FROM oven/bun

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl

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