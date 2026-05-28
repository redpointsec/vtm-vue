#!/bin/bash
set -e

# -----------------------------------------------
# VTM Vue — ECR push + ECS deploy script
# Usage: ./deploy.sh
#
# Prerequisites:
#   - AWS CLI configured (aws configure)
#   - Docker running
#   - ECS cluster and service already created
# -----------------------------------------------

AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REPO="vtm-vue"
IMAGE_TAG="${IMAGE_TAG:-latest}"
ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}"

ECS_CLUSTER="${ECS_CLUSTER:-vtm-cluster}"
ECS_SERVICE="${ECS_SERVICE:-vtm-vue-service}"

echo "==> Logging into ECR..."
aws ecr get-login-password --region "$AWS_REGION" \
  | docker login --username AWS --password-stdin "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

echo "==> Creating ECR repo if it doesn't exist..."
aws ecr describe-repositories --repository-names "$ECR_REPO" --region "$AWS_REGION" > /dev/null 2>&1 \
  || aws ecr create-repository --repository-name "$ECR_REPO" --region "$AWS_REGION"

echo "==> Building Docker image..."
docker build --platform linux/amd64 -t "${ECR_REPO}:${IMAGE_TAG}" .

echo "==> Tagging image..."
docker tag "${ECR_REPO}:${IMAGE_TAG}" "${ECR_URI}:${IMAGE_TAG}"

echo "==> Pushing to ECR..."
docker push "${ECR_URI}:${IMAGE_TAG}"

echo "==> Forcing ECS service redeployment..."
aws ecs update-service \
  --cluster "$ECS_CLUSTER" \
  --service "$ECS_SERVICE" \
  --force-new-deployment \
  --region "$AWS_REGION"

echo ""
echo "Done! Image: ${ECR_URI}:${IMAGE_TAG}"
echo "ECS service ${ECS_SERVICE} is redeploying."
