FROM node:18-alpine

# Cài OpenSSL cho Alpine để Prisma có thể tìm libssl
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files and Prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Cài dependencies
RUN npm install

# Giữ lại lệnh này để Prisma client tự update theo schema
RUN npx prisma generate

# Copy source and build
COPY . .
RUN npm run build

EXPOSE 4000

# CHỈ CHẠY NPM START, KHÔNG CẦN PUSH DB NỮA
CMD ["npm", "start"]
