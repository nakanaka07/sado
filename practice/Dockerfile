# ベースイメージを指定
FROM nginx:alpine

# 作業ディレクトリを設定
WORKDIR /usr/share/nginx/html

# ウェブサイトのファイルをコピー
COPY . .

# Nginxを起動
CMD ["nginx", "-g", "daemon off;"]
