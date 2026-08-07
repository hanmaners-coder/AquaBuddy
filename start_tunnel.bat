@echo off
rem Add Node.js to PATH
set "PATH=%PATH%;C:\Program Files\nodejs"
rem Start localtunnel on port 8080
npx localtunnel --port 8080
