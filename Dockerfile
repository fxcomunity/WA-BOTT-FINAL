FROM node:20-alpine

# Set working directory
WORKDIR /home/container

# Copy package files first (to leverage Docker cache)
COPY package.json package-lock.json ./

# Install production dependencies
RUN npm ci --production --omit=dev

# Copy the rest of the application code
COPY . .

# Expose any required ports (optional, keep as placeholder)
# EXPOSE 3000

# Set Node options (optional, can be overridden by Pterodactyl env)
ENV NODE_OPTIONS="--max-old-space-size=1024 --use-openssl-ca"

# Default command to start the bot (uses CMD_RUN environment variable if set)
CMD ["npm", "start"]
