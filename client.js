const API_BASE_URL = "https://dxtrade.ftmo.com/api";
const BUY = 0;
const SELL = 1;
class Identity {
    constructor(username, password, vendor, accountId) {
        this.username = username;
        this.password = password;
        this.vendor = vendor;
        this.cookies = {};
        this.csrf = '';
    }

    async fetchCSRF() {
        const url = `https://dxtrade.ftmo.com`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
                'Cookie': `DXTFID=${this.cookies["DXTFID"]}; JSESSIONID=${this.cookies["JSESSIONID"]}`
            }
        });
        const body = await response.text();
        const csrfMatch = body.match(/name="csrf" content="([^"]+)"/);
        if (csrfMatch) {
            this.csrf = csrfMatch[1];
        }
    }

    async login() {
        const url = `https://dxtrade.ftmo.com/api/auth/login`;
        const payload = JSON.stringify({
            vendor: this.vendor,
            username: this.username,
            password: this.password,
        });

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
            },
            body: payload
        });

        if (response.ok) {
            const cookies = response.headers.get('Set-Cookie');
            console.log('Logged in successfully', cookies);
            this.updateCookies(cookies);
        } else {
            console.error('Failed to log in:', response.status);
        }
    }

    updateCookies(rawCookies) {
        rawCookies.split(';').forEach(cookie => {
            const parts = cookie.split('=');
            this.cookies[parts[0].trim()] = parts[1].trim();
        });
    }

    async executeOrder(method, quantity, symbol, instrumentId) {
        const url = `${API_BASE_URL}/orders/single`;
        let orderSide = method === BUY ? 'BUY' : 'SELL';
        let orderType = 'MARKET';

        const payload = JSON.stringify({
            directExchange: false,
            legs: [{
                instrumentId,
                positionEffect: 'OPENING',
                ratioQuantity: 1,
                symbol
            }],
            limitPrice: 0,
            orderSide,
            orderType,
            quantity,
            requestId: `gwt-uid-931-${this.uuidV4()}`,
            timeInForce: 'GTC'
        });

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=UTF-8',
                'X-CSRF-Token': this.csrf,
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: payload
        });

        if (response.ok) {
            console.log('Order executed successfully');
        } else {
            console.error('Failed to execute order:', response.status);
        }
    }
    async closePosition(positionId, quantity, price, symbol, instrumentId) {
        const url = `${API_BASE_URL}/positions/close`;
        const payload = JSON.stringify({
            legs: [{
                instrumentId: instrumentId,
                positionCode: positionId,
                positionEffect: 'CLOSING',
                ratioQuantity: 1,
                symbol: symbol
            }],
            limitPrice: 0,
            orderType: 'MARKET',
            quantity: -quantity,
            timeInForce: 'GTC'
        });

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=UTF-8',
                'X-CSRF-Token': this.csrf,
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: payload
        });

        if (response.ok) {
            console.log('Position closed successfully');
        } else {
            console.error('Failed to close position:', response.status, await response.text());
        }
    }
    async getPositions() {
        var content = await this.linkWs("POSITIONS");
        console.log(content)
        return JSON.parse(content.toString().split('|')[1]);

    }
    async closeAllPositions() {
        var positions = await this.getPositions();
        for (var i = 0; i < positions.body.length; i++) {
            await identity.closePosition(positions.body[i].positionKey.positionCode, positions.body[i].quantity, 0, "US30.cash", positions.body[i].positionKey.instrumentId);
        }
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

    uuidV4() {
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    }
}

const identity = new Identity('','','');
(async () => {
    await identity.login();
    await identity.fetchCSRF();
    await identity.executeOrder(BUY, 0.01, 'EURUSD', 3438);
    console.log(identity.csrf);
   await identity.closeAllPositions();

})();
