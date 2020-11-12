FROM node:12.19.0-alpine3.12 AS base
RUN apk add --no-cache tini
WORKDIR /app
ENTRYPOINT ["/sbin/tini", "--"]
COPY . .

FROM base AS builder
RUN apk add --no-cache python3 openssl
RUN npm set progress=false && npm config set depth 0 && npm install
RUN NODE_ENV=production npm run build
RUN openssl req -new -newkey rsa:4096 -days 365 -nodes -x509 -subj "/C=US/ST=Denial/L=Springfield/O=Dis/CN=www.example.com" -keyout server_key.pem -out server_cert.pem

FROM base AS release
RUN npm install --only=production
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/*.pem /app/
EXPOSE 3000
CMD npm run start