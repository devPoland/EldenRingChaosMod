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

            if (data.action === 'get') {
                fs.readFile(filePath, 'utf8', (err, fileData) => {
                    if (err) {
                        console.error('Error reading config.json:', err);
                        return;
                    }
    
                    ws.send(JSON.stringify({
                        action: 'config',
                        config: JSON.parse(fileData)
                    }));
                });
            }
    
            else if (data.action === 'update' && data.key && data.value !== undefined) {
                fs.readFile(filePath, 'utf8', (err, fileData) => {
                    if (err) {
                        console.error('Error reading JSON file:', err);
                        return;
                    }
    
                    let jsonData = JSON.parse(fileData);
    
                    const keys = data.key.split('.');
                    let target = jsonData;
                    for (let i = 0; i < keys.length - 1; i++) {
                        if (!target[keys[i]]) target[keys[i]] = {};
                        target = target[keys[i]];
                    }
                    target[keys[keys.length - 1]] = data.value;
    
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
