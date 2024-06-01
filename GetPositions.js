class Identity {
    constructor(username, password, vendor, accountId) {
        this.username = username;
        this.password = password;
        this.vendor = vendor;
        this.cookies = {};
        this.csrf = '';
    }
    async getPositions() {
        var content = await this.linkWs("POSITIONS");
        return new Promise((resolve, reject) => {
            resolve(content.toString().split("|")[1]);
        });

    }
    linkWs(killMsg) {
        return new Promise((resolve, reject) => {
            const url = `wss://dxtrade.${this.vendor}.com/client/connector?X-Atmosphere-tracking-id=0&X-Atmosphere-Framework=2.3.2-javascript&X-Atmosphere-Transport=websocket&X-Atmosphere-TrackMessageSize=true&Content-Type=text/x-gwt-rpc;%20charset=UTF-8&X-atmo-protocol=true&sessionState=dx-new&guest-mode=false`; // WebSocket URL, adjust as necessary
            const ws = new WebSocket(url);

            ws.onopen = () => {
                console.log("WebSocket connection established.");
            };

            ws.onerror = (error) => {
                console.error("WebSocket error:", error);
                reject(error);
            };

            ws.onmessage = (event) => {
                if (event.data.includes(killMsg)) {
                    ws.close();
                    resolve(event.data);
                }
            };

            ws.onclose = () => {
                console.log("WebSocket connection closed.");
                resolve(null);
            };
        });
    }
}
const identity = new Identity('USERNAMEPLACEHOLDER','PASSWORDPLACEHOLDER','ftmo');
(async () => {
    document.body.innerHTML = await identity.getPositions();
})();