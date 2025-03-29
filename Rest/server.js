const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const WS_PORT = 8888;
const filePath = path.join(__dirname, 'config.json');

const wss = new WebSocket.Server({ port: WS_PORT }, () => {
    console.log(`WebSocket server running on ws://localhost:${WS_PORT}/`);
});

wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            if (data.action === 'update' && data.key && data.value !== undefined) {
                fs.readFile(filePath, 'utf8', (err, fileData) => {
                    if (err) {
                        console.error('Error reading JSON file:', err);
                        return;
                    }

                    let jsonData = JSON.parse(fileData);
                    jsonData[data.key] = data.value;

                    fs.writeFile(filePath, JSON.stringify(jsonData, null, 4), 'utf8', (err) => {
                        if (err) {
                            console.error('Error writing JSON file:', err);
                            return;
                        }
                        ws.send(JSON.stringify({ status: 'success', updatedData: jsonData }));
                    });
                });
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});
