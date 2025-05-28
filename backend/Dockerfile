FROM oven/bun:1.0.18-alpine
WORKDIR /app
COPY . .
RUN bun install
EXPOSE 4000
CMD ["bun", "run", "dev"]