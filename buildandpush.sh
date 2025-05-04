#!/bin/bash
set -e

# 配置变量
HARBOR_URL="harbor.anobodys.com"
IMAGE_NAME="flowdock/frontend-ele"
IMAGE_TAG="latest"
FULL_IMAGE_NAME="${HARBOR_URL}/${IMAGE_NAME}:${IMAGE_TAG}"

# 构建前端应用
echo "Building frontend application..."
pnpm run build:ele

# 构建 Docker 镜像
echo "Building Docker image: ${FULL_IMAGE_NAME}"
docker build -t ${FULL_IMAGE_NAME} -f Dockerfile .

# 登录到 Harbor
echo "Logging in to Harbor registry..."
docker login ${HARBOR_URL} -u "admin" -p "3sDragonsss*"

# 推送镜像到 Harbor
echo "Pushing image to Harbor..."
docker push ${FULL_IMAGE_NAME}

echo "Image successfully pushed to ${FULL_IMAGE_NAME}"
