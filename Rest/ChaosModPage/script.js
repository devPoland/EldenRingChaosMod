document.addEventListener('DOMContentLoaded', function() {
    const ws = new WebSocket("ws://localhost:8888");
    let cd = false;

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
            alert("Please enter both key and value.");
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

    setchannel.addEventListener('click', function() {
        const twitchChannel = inputField.value.trim();
        updateJsonValue("channel", twitchChannel);
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
        } else {
            console.log('Please enter a Twitch channel name');
        }
    });
});