FROM oven/bun:latest

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy the rest of the code
COPY . .

# Create a non-root user
RUN adduser --system --uid 1001 bunuser
RUN chown -R bunuser:bunuser /app
USER bunuser

EXPOSE 8080

CMD ["bun", "run", "start"]
