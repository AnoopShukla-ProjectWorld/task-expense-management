# 🐳 Docker Learning Guide: Concepts, Code Breakdown & Commands

Welcome to your hands-on Docker guide! If you are new to Docker, this document will help you understand **exactly** how Docker works, how it applies to our Task & Expense Management project, and how you can manage containers on your own system.

---

## 🌟 Part 1: Core Docker Concepts (In Simple Terms)

Imagine you built a house (your app) on your local computer. It works perfectly. But when you move it to another computer, it breaks because that computer has a different Node.js version, a different operating system, or is missing environment configurations. 

**Docker solves this by packing your app along with everything it needs (Node.js, OS libraries, config) into a single standard box called a Container.** Wherever you run this container (Windows, Linux, macOS, AWS Cloud), it behaves exactly the same way.

### The 4 Pillars of Docker:
1. **Dockerfile**: A recipe book (text file) containing step-by-step instructions on how to build a virtual environment for a single service (like your Express API or React UI).
2. **Image**: The compiled, read-only package generated from your Dockerfile. Think of the **Image as a Blueprint / CD-ROM** and the **Dockerfile as the code used to compile it**.
3. **Container**: The actual running instance of your Image. If an Image is a Blueprint, the **Container is the actual physical house built from that blueprint**. You can start, stop, or delete containers.
4. **Docker Compose**: A master tool (`docker-compose.yml`) used to run and coordinate **multiple containers** (like running your Frontend Nginx container and your Backend Express container together in their own private virtual network).

---

## 🔍 Part 2: Line-by-Line Breakdown of Our Project Files

Let's look at the four files we created, where they are placed, and exactly what each line does.

### 📁 File 1: Server Dockerfile (`/server/Dockerfile`)
This file is placed inside the `/server` folder. It tells Docker how to build the backend Express server image.

```dockerfile
# 1. Start from an official pre-built image containing Node.js v20 on a lightweight Linux (Alpine) OS
FROM node:20-alpine

# 2. Define our working directory inside the virtual container. All next commands run here.
WORKDIR /app

# 3. Copy only the package metadata files to the container first
COPY package*.json ./

# 4. Install only production dependencies (npm ci/install). We copy files first so that if package.json doesn't change, Docker skips this step and builds instantly (Caching).
RUN npm install --only=production

# 5. Copy all the remaining source code files from your local /server folder into the container
COPY . .

# 6. Inform Docker that the container will listen on port 5000 at runtime
EXPOSE 5000

# 7. The final command to execute inside the container to start our backend server
CMD ["npm", "start"]
```

---

### 📁 File 2: Client Nginx Config (`/client/nginx.conf`)
Placed inside the `/client` folder. In production, we don't run Node.js to serve HTML/JS files; we use **Nginx** (an extremely fast, lightweight web server).

```nginx
server {
    # Nginx will listen on port 80 (standard HTTP port) inside the container
    listen 80;
    server_name localhost;

    # Where Nginx should find the built HTML/JS assets to show the user
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        
        # Crucial for Single Page Applications (React Router). If a user refreshes http://localhost:3000/tasks, 
        # Nginx is told to redirect the routing logic back to index.html instead of showing a 404 error.
        try_files $uri $uri/ /index.html;
    }

    # REVERSE PROXY: Whenever the React frontend calls an endpoint starting with "/api", 
    # Nginx intercepts it and forwards it to the backend container named "server" on port 5000.
    location /api {
        proxy_pass http://server:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
```

---

### 📁 File 3: Client Dockerfile (`/client/Dockerfile`)
Placed inside the `/client` folder. This uses a **Multi-Stage Build**. It compiles React code in Stage 1, discards all bulky `node_modules`, and copies ONLY the tiny compiled assets to Nginx in Stage 2. This keeps the final Docker image extremely small (from ~800MB down to ~30MB!).

```dockerfile
# STAGE 1: Compiling the code
FROM node:20-alpine AS build
WORKDIR /app

# Copy package configs and install dependencies
COPY package*.json ./
RUN npm install

# Copy source assets and run the build script (Vite outputs static files into the /dist folder)
COPY . .
RUN npm run build

# STAGE 2: Serving static assets
FROM nginx:alpine

# Copy the compiled HTML/JS files from Stage 1 (/app/dist) into Nginx's default folder
COPY --from=build /app/dist /usr/share/nginx/html

# Replace Nginx's default config with our custom reverse proxy routing script (nginx.conf)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

### 📁 File 4: Master Orchestrator (`/docker-compose.yml`)
Placed in the **root directory** (`D:\My Projects\task-expense-management\docker-compose.yml`). This coordinates both frontend and backend containers together.

```yaml
version: '3.8'

services:
  # 1. OUR BACKEND SERVICE
  server:
    # Build using the Dockerfile inside the /server folder
    build:
      context: ./server
      dockerfile: Dockerfile
    container_name: task-expense-server
    restart: always
    ports:
      - "5000:5000"  # Map port 5000 of your local computer to port 5000 of the container
    env_file:
      - ./server/.env # Read all database and API credentials from your local server/.env file
    volumes:
      - uploads_data:/app/uploads # Keep receipt uploads persistent on local disk
    networks:
      - app-network
    extra_hosts:
      # Allows the container to communicate with host SQL Server on Windows via 'host.docker.internal'
      - "host.docker.internal:host-gateway"

  # 2. OUR FRONTEND SERVICE
  client:
    # Build using the Dockerfile inside the /client folder
    build:
      context: ./client
      dockerfile: Dockerfile
    container_name: task-expense-client
    restart: always
    ports:
      - "3000:80"   # Map port 3000 of your computer to port 80 of the Nginx container
    depends_on:
      - server      # Do not start client until the backend server container is running
    networks:
      - app-network

# Create a shared virtual network bridge so our containers can talk to each other using hostnames (e.g. client connects to server via "http://server:5000")
networks:
  app-network:
    driver: bridge

# Create persistent storage spaces
volumes:
  uploads_data:
    driver: local
```

---

## 🚀 Part 3: Step-by-Step CLI Execution (Exactly What Happens)

Here are the commands you will run in your terminal, and exactly what Docker is doing behind the scenes.

### 📋 Prerequisites
1. Download and install **Docker Desktop** on Windows.
2. Open Docker Desktop and make sure it is running (the icon in the bottom-left turns green).

---

### 🎛️ Step 1: Navigate to Project Folder
Open your PowerShell or Command Prompt, and go to your project root folder:
```powershell
cd "D:\My Projects\task-expense-management"
```

---

### 🎛️ Step 2: Build the Container Images
Run this command in the terminal:
```powershell
docker compose build
```
* **Under the Hood**: 
  1. Docker reads `docker-compose.yml` and sees two services (`server` and `client`).
  2. It goes to `/server`, reads `Dockerfile`, downloads the `node:20-alpine` base OS image, runs `npm install`, and saves the compiled backend blueprint as an **Image**.
  3. It goes to `/client`, reads `Dockerfile`, installs packages, compiles your React code, copies the files into the `nginx` web server, and compiles the frontend **Image**.

---

### 🎛️ Step 3: Run the Containers (Bring the App Live)
Run this command:
```powershell
docker compose up -d
```
* **-d** means "Detached" mode. It starts the containers in the background so your terminal remains free to type more commands.
* **Under the Hood**:
  1. Docker creates the virtual network bridge (`app-network`).
  2. It mounts the persistent folder (`uploads_data`) for storing upload files.
  3. It boots the `task-expense-server` container first.
  4. It boots the `task-expense-client` container on port `3000`.

---

### 🎛️ Step 4: Check Running Containers
To verify if both services are running happily, run:
```powershell
docker compose ps
```
* **Under the Hood**: Displays a neat list of running containers, their IDs, status (e.g., `Up 2 minutes`), and port mappings.

---

### 🎛️ Step 5: Read Live Server Logs (For Debugging)
To see console logs, DB connection status, or potential errors, run:
```powershell
docker compose logs -f
```
* **-f** means "Follow". It acts as a real-time terminal stream. You can see database query logs as they occur. Press `Ctrl + C` to safely exit the logs view (this does NOT stop the app, it just exits the logger).

---

### 🎛️ Step 6: Stop the Application
When you are done testing and want to clean up your computer's RAM, run:
```powershell
docker compose down
```
* **Under the Hood**: Gracefully stops both containers, deletes the temporary virtual network bridges, but keeps your persistent uploaded files (`uploads_data`) and code safe on your hard drive.
