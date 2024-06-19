firewall-cmd --add-port 80/tcp
firewall-cmd --add-port 443/tcp

cd /root/main/Shishiji

sudo npx ts-node ./src/server/app.ts
