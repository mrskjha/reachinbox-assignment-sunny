# backend/Dockerfile
FROM node:20

WORKDIR /src

# Package files copy aur install karna
COPY package*.json ./
RUN npm install --verbose


# Pura code copy karna
COPY . .

# Prisma client generate karna
RUN npx prisma generate

EXPOSE 5000

# Agar aap nodemon ya ts-node se dev script chalate hain
CMD ["npm", "run", "dev"]