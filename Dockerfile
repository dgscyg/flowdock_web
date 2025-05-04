# 使用官方 Nginx 镜像作为基础镜像
FROM nginx:stable-alpine

# 设置时区
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 复制构建好的文件到 Nginx 服务目录
COPY ./apps/web-ele/dist/ /usr/share/nginx/html/

# 复制自定义 Nginx 配置文件
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# 暴露 80 端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://localhost/ || exit 1

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
