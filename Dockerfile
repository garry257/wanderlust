# Use the Node version specified in your project
FROM node:24.14.1-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package files first to cache dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all the rest of your code files
COPY . .

# Expose port 8080 since that's what your app.js uses
EXPOSE 8080

# Command to run your app
CMD ["node", "app.js"]
