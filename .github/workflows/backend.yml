name: Backend Deployment

on:
  push:
    branches:
      - main
    paths:
      - "backend/**"

jobs:
  backend:
    runs-on: ubuntu-latest

    steps:
      - name: Deploy backend to EC2
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ubuntu
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd ~/wedraw

            echo "Pull latest code"
            git pull origin main

            echo "Go to backend"
            cd backend

            echo "Install dependencies"
            npm ci

            echo "Generate Prisma Client"
            npx prisma generate

            echo "Build TypeScript"
            npm run build

            echo "Restart backend"
            pm2 restart backend --update-env || pm2 start dist/index.js --name backend

            echo "Save PM2 process"
            pm2 save