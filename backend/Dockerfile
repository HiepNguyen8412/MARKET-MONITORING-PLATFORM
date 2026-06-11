FROM node:18-alpine

# Cài OpenSSL cho Alpine để Prisma có thể tìm libssl
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files and (optional) prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Cài dependencies
RUN npm install

# THÊM 2 DÒNG NÀY ĐỂ PRISMA KHÔNG BỊ LỖI KHI BUILD
ENV PRISMA_CLI_BINARY_TARGETS=debian-openssl-3.0.x
RUN npx prisma generate
RUN npx prisma db push

# Copy source and build
COPY . .
RUN npm run build

EXPOSE 4000

# Start application
CMD ["npm", "start"]
