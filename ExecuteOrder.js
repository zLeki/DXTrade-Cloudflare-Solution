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
    uuidV4() {
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
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
}
const identity = new Identity('USERNAMEPLACEHOLDER','PASSWORDPLACEHOLDER','VENDORPLACEHOLDER');
(async () => {
    await identity.fetchCSRF();
    await identity.executeOrder(BUY, 0.01, 'EURUSD', 3438);
})();