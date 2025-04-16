# FROM node:20-alpine AS base

# WORKDIR /app

# # 安装 pnpm
# RUN npm install -g pnpm

# # 复制项目的 package.json 和 pnpm-lock.yaml（如果存在）
# COPY ../../package.json ../../pnpm-lock.yaml* ./

# # 安装依赖
# RUN pnpm install

# # 复制整个项目
# COPY ../../ .

# EXPOSE 3000

# # 使用 dev:ele 命令启动应用
# CMD ["pnpm", "-F", "@vben/web-ele", "run", "dev"]

FROM node:20-slim AS builder

# --max-old-space-size
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_OPTIONS=--max-old-space-size=8192
ENV TZ=Asia/Shanghai

RUN corepack enable

WORKDIR /app

# copy package.json and pnpm-lock.yaml to workspace
COPY . /app

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build --filter=\!./docs

RUN echo "Builder Success 🎉"

FROM nginx:stable-alpine AS production

RUN echo "types { application/javascript js mjs; }" > /etc/nginx/conf.d/mjs.conf
COPY --from=builder /app/playground/dist /usr/share/nginx/html

COPY --from=builder /app/scripts/deploy/nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080

# start nginx
CMD ["nginx", "-g", "daemon off;"]
