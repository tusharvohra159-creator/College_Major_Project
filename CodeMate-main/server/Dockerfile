FROM node:18

WORKDIR /app

# Install system runtimes required for executing submitted code
RUN apt-get update && \
		DEBIAN_FRONTEND=noninteractive apt-get install -y \
			python3 \
			python3-pip \
			default-jdk \
			build-essential \
			g++ \
			gcc \
			--no-install-recommends && \
		rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "start"]