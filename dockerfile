# Use official Bun image
FROM oven/bun:latest

# Set working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN bun install

# Copy the rest of the application code
COPY . .

# Build TypeScript files
# RUN bun run build

# Expose default ports (optional, adjust as needed)
EXPOSE 3000 4000 5000 6000

# Set environment variable for production
ENV NODE_ENV=production

# Copy entrypoint script and set permissions
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Set the entrypoint
ENTRYPOINT ["/entrypoint.sh"]