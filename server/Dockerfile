FROM node:18.19.0

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port 5000
EXPOSE 5000

# Start the server with nodemon and explicit port
CMD ["npm", "run", "dev"] 