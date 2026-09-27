# 🚀 Wanderlust — DevOps Interview Guide

## Project Overview
**Wanderlust** is a full-stack travel listing web application built with:
- **Backend:** Node.js + Express
- **Frontend:** EJS templates served by Express (monorepo)
- **Database:** MongoDB Atlas (cloud)
- **Live URL:** https://wanderlust-airq.onrender.com

---

## 🔁 CI/CD Pipeline — How It Works

### Full Flow Diagram
```
Developer writes code
        │
        │ git push / pull request
        ▼
    📦 GitHub (garry257/wanderlust)
        │
        │ triggers automatically
        ▼
  ⚙️  GitHub Actions (ci.yml)
        │
  ┌─────┴──────────────────────────────────┐
  ▼
✅ Job 1: Test & Lint (any branch)
  - Installs backend dependencies
  - Verifies app.js exists
  - Runs npm test
  - Verifies EJS views, CSS, JS assets
  │
  │ (only if Job 1 passes)
  ▼
✅ Job 2: Docker Build & Push
  - Logs into Docker Hub
  - Builds Docker image (multi-stage)
  - Tags with Git SHA + latest
  - Pushes gauravaa/wanderlust:SHA
  - Pushes gauravaa/wanderlust:latest
  │
  │ (only on push to main branch)
  ▼
✅ Job 3: Deploy to Render
  - Calls Render deploy hook URL
  - Render pulls latest image and restarts
  - Live at wanderlust-airq.onrender.com
```

---

## 📋 Step-by-Step Explanation

### Step 1 — Developer Pushes Code
```bash
git add .
git commit -m "feat: add new listing feature"
git push origin main
```
- GitHub receives the push
- GitHub Actions **automatically triggers** within seconds

---

### Step 2 — Job 1: Test & Lint
**File:** `.github/workflows/ci.yml`

**What it does:**
1. Checks out the code from GitHub
2. Sets up Node.js version 24
3. Runs `npm install` in the `backend/` folder
4. Verifies `backend/app.js` exists (entry point check)
5. Runs `npm test` (skips gracefully if no tests written)
6. Lists all EJS views, CSS files, JS files to verify frontend assets exist

**Why this matters:**
> "We run tests before building the Docker image. This ensures we never ship broken code to production. If Job 1 fails, Job 2 and Job 3 are automatically cancelled."

---

### Step 3 — Job 2: Docker Build & Push
**Only runs if Job 1 passed.**

**What it does:**
1. Sets up Docker Buildx (for multi-platform builds)
2. Logs into Docker Hub using `DOCKER_USERNAME` and `DOCKER_PASSWORD` secrets
3. Gets the short Git SHA (e.g., `a1b2c3d`)
4. Builds the Docker image using our multi-stage `Dockerfile`
5. Tags the image with:
   - `gauravaa/wanderlust:a1b2c3d` ← exact commit SHA
   - `gauravaa/wanderlust:latest` ← always points to newest
6. Pushes both tags to Docker Hub

**Why two tags?**
> "The SHA tag lets us roll back to any exact version. The `latest` tag is what production always uses. If something breaks, we can redeploy a previous SHA instantly."

**Why multi-stage Dockerfile?**
> "Stage 1 installs all dependencies. Stage 2 only copies what is needed — no dev tools. This makes the final image smaller and more secure. We also run as a non-root user for security."

---

### Step 4 — Job 3: Deploy to Render
**Only runs if Job 2 passed AND push is to `main` branch.**

**What it does:**
1. Calls the **Render Deploy Hook URL** (a secret webhook)
2. Render receives the call, pulls the new Docker image
3. Restarts the service with zero downtime
4. App is live at `https://wanderlust-airq.onrender.com`

**Why Render?**
> "Render is a cloud platform-as-a-service. It handles SSL certificates, domain routing, and scaling automatically. It is ideal for projects where you want production deployment without managing servers."

---

## 🔐 GitHub Secrets Used

| Secret Name | Purpose |
|-------------|---------|
| `DOCKER_USERNAME` | Docker Hub login username (gauravaa) |
| `DOCKER_PASSWORD` | Docker Hub login password |
| `RENDER_DEPLOY_HOOK_URL` | Webhook URL to trigger Render deployment |

> "Secrets are stored encrypted in GitHub and injected as environment variables at runtime. They are never visible in logs or to anyone viewing the repository."

---

## 🐳 Docker Setup — Multi-Stage Build

```
Stage 1 (builder):
  - Base: node:24-alpine
  - Copies package.json
  - Runs npm install --omit=dev
  - Result: node_modules ready

Stage 2 (runner):
  - Base: node:24-alpine (fresh, clean)
  - Creates non-root user (appuser)
  - Copies node_modules from Stage 1
  - Copies backend/ and frontend/ source
  - Runs as non-root user
  - EXPOSE 8080
  - CMD: node backend/app.js
```

**Benefits:**
- Smaller image (no dev dependencies in production)
- More secure (non-root user)
- Layer caching speeds up builds

---

## ☸️ Kubernetes — Local Setup (Minikube)

### Files Created

| File | Kind | Purpose |
|------|------|---------|
| `k8s/namespace.yaml` | Namespace | Isolates resources under `wanderlust` namespace |
| `k8s/configmap.yaml` | ConfigMap | Non-sensitive config: NODE_ENV, PORT |
| `k8s/secret.yaml` | Secret | Sensitive data: ATLAS_URI, CLOUD credentials |
| `k8s/deployment.yaml` | Deployment | 2 replicas with rolling updates + health probes |
| `k8s/service.yaml` | Service | NodePort — exposes app on port 30080 |
| `k8s/ingress.yaml` | Ingress | Routes domain to the service |

### How to Run Locally with Minikube
```bash
# Start Minikube
minikube start

# Apply in order (namespace first!)
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml

# Check everything is running
kubectl get all -n wanderlust

# Access the app
minikube service wanderlust-service -n wanderlust
```

### Rolling Update Strategy (Zero Downtime)
```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1       # 1 extra pod during update
    maxUnavailable: 0 # zero downtime
```
> "When I deploy a new version, Kubernetes starts a new pod first, waits for it to be healthy, then removes the old one. Zero downtime."

### Health Probes
```yaml
readinessProbe:   # is pod ready to receive traffic?
  httpGet:
    path: /
    port: 8080

livenessProbe:    # is pod still alive?
  httpGet:
    path: /
    port: 8080
```

### ConfigMap vs Secret
> "ConfigMap stores non-sensitive config like NODE_ENV=production. Secret stores sensitive data like database passwords, encrypted in etcd."

---

## ❓ Why Kubernetes Is NOT in the CI/CD Workflow

### What to Say in the Interview

> "I have fully written all the Kubernetes manifests — Namespace, ConfigMap, Secret, Deployment with rolling updates, Service, and Ingress. I tested them locally with Minikube and the pods run correctly.
>
> However, to connect GitHub Actions to a Kubernetes cluster, the cluster must be accessible from the internet. My local Minikube cluster runs on my laptop and cannot be reached by GitHub's cloud servers.
>
> To add Kubernetes deployment to the CI/CD pipeline, I need a cloud-hosted Kubernetes cluster such as GKE (Google), EKS (AWS), or AKS (Azure). These cost approximately Rs 5,000 to Rs 6,000 per month, which is outside my budget for a student project.
>
> For production deployment I am using Render, which provides the same result — containerized deployment with automatic restarts and zero downtime. The Kubernetes manifests are production-ready and can be deployed to any cloud cluster immediately."

---

## ✅ How to Add Kubernetes to CI/CD (When Ready)

### Step 1 — Get a Cloud K8s Cluster
Options:
- **GKE** (Google Kubernetes Engine)
- **AKS** (Azure Kubernetes Service) — has free tier
- **Civo** — cheapest, approx $5 per month

### Step 2 — Export and Encode Kubeconfig
```bash
kubectl config view --raw > kubeconfig.yaml
cat kubeconfig.yaml | base64 -w 0
```

### Step 3 — Add GitHub Secret
```
Name:  KUBECONFIG
Value: <paste the base64 encoded kubeconfig>
```

### Step 4 — Add This Job to ci.yml
```yaml
kubernetes:
  name: Deploy to Kubernetes
  runs-on: ubuntu-latest
  needs: docker
  if: github.ref == 'refs/heads/main'

  steps:
    - name: Configure kubeconfig
      run: |
        mkdir -p $HOME/.kube
        echo "${{ secrets.KUBECONFIG }}" | base64 -d > $HOME/.kube/config

    - name: Update image in cluster
      run: |
        kubectl set image deployment/wanderlust-deployment \
          wanderlust=gauravaa/wanderlust:${{ github.sha }} \
          -n wanderlust

    - name: Wait for rollout
      run: |
        kubectl rollout status deployment/wanderlust-deployment \
          -n wanderlust --timeout=120s
```

---

## 📊 Full DevOps Stack Summary

| Tool | Purpose | Status |
|------|---------|--------|
| Git + GitHub | Version control, code hosting | Live |
| GitHub Actions | CI/CD automation | Running |
| Docker (multi-stage) | Containerization | Built and pushed |
| Docker Hub | Container registry | gauravaa/wanderlust |
| Render | Cloud deployment (production) | Live |
| Kubernetes + Minikube | Container orchestration (local) | Manifests ready |
| MongoDB Atlas | Cloud database | Connected |

---

## 💡 Key Interview Questions and Answers

**Q: Why Docker?**
A: Containerization ensures the app runs the same in development, CI, and production. Eliminates "works on my machine" problems.

**Q: Why multi-stage build?**
A: Smaller, more secure production image. Build tools stay out of production.

**Q: Why GitHub Actions?**
A: It is tightly integrated with GitHub, free for public repos, YAML-based, and easy to maintain.

**Q: What is a deploy hook?**
A: A unique URL that triggers a deployment when called. More secure than giving CI/CD full access to the server.

**Q: Why 2 replicas in Kubernetes?**
A: High availability. If one pod crashes, the other serves traffic while Kubernetes restarts the crashed pod.

**Q: What is RollingUpdate?**
A: Zero-downtime deployment strategy. New pod starts and becomes healthy, then old pod is removed.

**Q: Difference between ConfigMap and Secret?**
A: ConfigMap is for non-sensitive config. Secret is for sensitive data like passwords and tokens, stored encrypted in etcd.

**Q: What would you improve?**
A: Add proper unit tests with Jest, add code quality checks with ESLint, add Docker image vulnerability scanning with Trivy, and deploy to a cloud Kubernetes cluster to complete the full pipeline.
