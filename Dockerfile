# Use the official Node.js image as a base image
FROM node:14.21.0

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Set the environment variable to production
ENV NODE_ENV=production

# Expose the port that the app runs on
EXPOSE 5173

# Define the command to run the app
CMD ["npm", "run", "docker"]
