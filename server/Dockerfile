FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first to leverage Docker layer caching
COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy remaining server source files
COPY . .

# Expose standard port
EXPOSE 5000

# Run starting production execution command
CMD ["npm", "start"]
