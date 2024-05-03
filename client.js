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
        const url = `${API_BASE_URL}/auth/login`;
        const payload = JSON.stringify({
            username: this.username,
            password: this.password,
            vendor: this.vendor,
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

    async executeOrder(method, quantity, price, takeProfit, stopLoss, symbol, instrumentId) {
        const url = `${API_BASE_URL}/orders/single`;
        let orderSide = method === BUY ? 'BUY' : 'SELL';
        let orderType = price === -1 ? 'MARKET' : 'LIMIT';

        const payload = JSON.stringify({
            directExchange: false,
            legs: [{
                instrumentId,
                positionEffect: 'OPENING',
                ratioQuantity: 1,
                symbol
            }],
            limitPrice: price !== -1 ? price : 0,
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

    uuidV4() {
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    }
}

const identity = new Identity('','','');
(async () => {
    await identity.fetchCSRF()
    await identity.login();
    await identity.executeOrder(BUY, 0.01, -1, 2.1, 0.4, 'EURUSD', 3438);
    console.log(identity.csrf);
})();
