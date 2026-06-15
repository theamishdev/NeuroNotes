FROM node:20

WORKDIR /app

# Copy root and workspace package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install dependencies using the root legacy configuration
RUN npm run install:all

# Copy remainder of codebase
COPY . .

# Compile production assets of the Vite client
RUN npm run build

# Expose port 3000 for serving
EXPOSE 3000

# Start Express server
CMD ["node", "backend/server.js"]
