document.addEventListener('DOMContentLoaded', function() {
    const ws = new WebSocket("ws://localhost:8888");
    let cd = false;

    const overlay = document.getElementById('ws-overlay');
    const msg = document.getElementById('msg');
    const bmsg = document.getElementById('bmsg');

    ws.onopen = () => {
        overlay.classList.add('hidden');
    };
    
    ws.onerror = () => {
        msg.textContent = '⚠ This is an error, something went wrong. ⚠';
        bmsg.textContent = 'The console might have some useful information.';
        overlay.classList.remove('hidden');
    };
    
    ws.onclose = () => {
        msg.textContent = '⚠ Connection Lost ⚠';
        bmsg.innerHTML = `
        The websocket is not connected.<br>
        Without this, you won't be able to change the config values.<br>
        Make sure you ran the config.bat inside the "Cheat Engine" folder.<br>
        If the terminal window opened later than the site, refresh.
        `;
    
        overlay.classList.remove('hidden');
    };

    async function getData(twitchusername) {
        twitchusername = twitchusername.toLowerCase();
        const apiUrl = `https://api.ivr.fi/v2/twitch/user?login=${twitchusername}`;
        try {
            const response = await fetch(apiUrl);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`Error fetching data for ${twitchusername}`, error);
            return [];
        }
    }

    function updateJsonValue(key, value) {
        if (value === "") {
            alert("Someting went wrong with the value parameneter.");
            return;
        }
    
        const message = JSON.stringify({
            action: "update",
            key: key,
            value: value
        });
    
        ws.send(message);
    }

    function formatNumberWithCommas(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    const inputField = document.getElementById('inputfield');
    const submitButton = document.getElementById('buttonid');
    const sideContainer = document.getElementById('sidecontainer');
    const setchannel = document.getElementById('setchannel');

    const cpfp = document.getElementById('cpfp');
    const ctitle = document.getElementById('ctitle');
    const cfollowers = document.getElementById('cfollowers');
    const cbanner = document.getElementById('cbanner');
    const cbio = document.getElementById('cbio');
    const cdisplayname = document.getElementById('cdisplayname');
    
    const triggersContainer = document.getElementById('triggers-container');

    const restartButton = document.getElementById('resetbutton');
    const randomButton = document.getElementById('randombutton');

    function renderTriggers(triggerObj) {
        triggersContainer.innerHTML = '';
    
        for (const [name, config] of Object.entries(triggerObj)) {
            const item = document.createElement('div');
            item.className = 'trigger-item';
    
            const label = document.createElement('label');
            label.textContent = name;
    
            const toggleContainer = document.createElement('div');
            toggleContainer.className = 'toggle-container';
    
            const toggleLabel = document.createElement('span');
            toggleLabel.textContent = 'Enabled';
    
            const toggle = document.createElement('div');
            toggle.className = 'custom-toggle';
            toggle.classList.toggle('active', config.enabled);
            toggle.addEventListener('click', () => {
                toggle.classList.toggle('active');
                const newState = toggle.classList.contains('active');
                updateJsonValue(`triggers.${name}.enabled`, newState);
            });
    
            toggleContainer.appendChild(toggleLabel);
            toggleContainer.appendChild(toggle);
    
            const rangeWrapper = document.createElement('div');
            rangeWrapper.className = 'range-wrapper';
    
            const rangeLabel = document.createElement('span');
            rangeLabel.className = 'range-label';
            rangeLabel.textContent = `Chance: ${config.chance}`;

            rangeLabel.addEventListener('click', () => {
                const input = document.createElement('input');
                input.type = 'number';
                input.min = 0;
                input.max = 1000;
                input.value = range.value;
                input.className = 'inline-input';
                rangeWrapper.replaceChild(input, rangeLabel);
                input.focus();
            
                const commitChange = () => {
                    let val = parseInt(input.value);
                    if (isNaN(val)) val = 0;
                    val = Math.min(1000, Math.max(0, val));
                    range.value = val;
                    updateJsonValue(`triggers.${name}.chance`, val);
            
                    rangeLabel.textContent = `Chance: ${val}`;
                    rangeWrapper.replaceChild(rangeLabel, input);
                };
            
                input.addEventListener('blur', commitChange);
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        input.blur();
                    } else if (e.key === 'Escape') {
                        rangeWrapper.replaceChild(rangeLabel, input);
                    }
                });
            });
    
            const range = document.createElement('input');
            range.type = 'range';
            range.min = 0;
            range.max = 1000;
            range.value = config.chance;
            range.className = 'styled-slider';
            range.addEventListener('input', () => {
                rangeLabel.textContent = `Chance: ${range.value}`;
            });
            range.addEventListener('change', () => {
                updateJsonValue(`triggers.${name}.chance`, parseInt(range.value));
            });
    
            rangeWrapper.appendChild(rangeLabel);
            rangeWrapper.appendChild(range);
    
            const controls = document.createElement('div');
            controls.className = 'trigger-controls';
            controls.appendChild(toggleContainer);
            controls.appendChild(rangeWrapper);
    
            item.appendChild(label);
            item.appendChild(controls);
            triggersContainer.appendChild(item);
        }
    }    

    function fetchConfig(callback) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ action: 'get' }));
        } else {
            ws.addEventListener('open', () => {
                ws.send(JSON.stringify({ action: 'get' }));
            });
        }
    
        ws.addEventListener('message', (event) => {
            const data = JSON.parse(event.data);
            if (data.action === 'config' && data.config) {
                callback(data.config);
            }
        });
    }

    let db = false;
    fetchConfig((data) => {
        if (data.triggers) {
            renderTriggers(data.triggers);
    
            restartButton.addEventListener('click', function() {
                if (db) return;
                db = true;
                setTimeout(() => { db = false }, 500);
                const updates = [];

                for (const [name, config] of Object.entries(data.triggers)) {
                    updates.push({ key: `triggers.${name}.enabled`, value: true });
                    updates.push({ key: `triggers.${name}.chance`, value: config.basechance });
                }
            
                ws.send(JSON.stringify({
                    action: 'batchUpdate',
                    updates
                }));

                ws.addEventListener('message', function handler(event) {
                    const res = JSON.parse(event.data);
                    if (res.status === 'success') {
                        fetchConfig((data) => {
                            renderTriggers(data.triggers);
                        });
                        ws.removeEventListener('message', handler);
                    }
                });
            }); 

            randomButton.addEventListener('click', function() {
                if (db) return;
                db = true;
                setTimeout(() => { db = false }, 500);
                const updates = [];

                for (const [name, config] of Object.entries(data.triggers)) {
                    const randomChance = Math.floor(Math.random() * 1001);
                    updates.push({ key: `triggers.${name}.chance`, value: randomChance });
                }
            
                ws.send(JSON.stringify({
                    action: 'batchUpdate',
                    updates
                }));
            
                ws.addEventListener('message', function handler(event) {
                    const res = JSON.parse(event.data);
                    if (res.status === 'success') {
                        fetchConfig((data) => {
                            renderTriggers(data.triggers);
                        });
                        ws.removeEventListener('message', handler);
                    }
                });
            }); 
        }
    });



    setchannel.addEventListener('click', function() {
        const twitchChannel = inputField.value.trim();
        updateJsonValue("channel", twitchChannel);
        setchannel.style.animation = "none";
        void setchannel.offsetWidth;
        setchannel.style.animation = "success 1s ease";
    }); 

    submitButton.addEventListener('click', function() {
        const twitchChannel = inputField.value.trim();
        
        if (twitchChannel) {
            if (!cd) {
                getData(twitchChannel).then((data)=>{
                    if (!data || data.length === 0) {
                        ctitle.textContent = 'Error Fetching Data';
                        cpfp.src = 'https://cdn.7tv.app/emote/01F010G3WG0007E4VV006YKSKP/4x.png';
                        cfollowers.textContent = 'Do NOT set this as your channel, unless you think this is a mistake, re-validate.';
                        cbanner.src = 'https://cdn.7tv.app/emote/01EZPJA6T0000C438200A44F31/4x.png';
                        cbio.textContent = '';
                        cdisplayname.textContent = '';
                        return;
                    }

                    console.log(data);
                    ctitle.textContent = data[0].login ? data[0].login : 'Error Fetching Data';
                    if (data[0].displayName !== data[0].login){
                        cdisplayname.textContent = data[0].displayName ? `(${data[0].displayName})` : '';
                    }else{
                        cdisplayname.textContent = '';
                    }
                    cpfp.src = data[0].logo ? data[0].logo : 'https://cdn.7tv.app/emote/01F010G3WG0007E4VV006YKSKP/4x.png';
                    cfollowers.textContent = data[0].followers ? `Followers: ${formatNumberWithCommas(data[0].followers)}` : 'Error Fetching Data';
                    cbanner.src = data[0].banner ? data[0].banner : 'https://cdn.7tv.app/emote/01F010G3WG0007E4VV006YKSKP/4x.png';
                    cbio.textContent = data[0].bio ? `"${data[0].bio}"` : '';
                });
                sideContainer.classList.add('visible');
                cd = true;
    
                setTimeout(() => { cd = false; sideContainer.classList.remove('visible'); }, 5000);
            }
            submitButton.style.animation = "none";
            void setchannel.offsetWidth;
            submitButton.style.animation = "success 1s ease";
        } else {
            submitButton.style.animation = "none";
            void setchannel.offsetWidth;
            submitButton.style.animation = "fail 1s ease";
        }
    });
});