const API_BASE_URL = "https://dxtrade.ftmo.com/api";
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
}
const identity = new Identity('USERNAMEPLACEHOLDER','PASSWORDPLACEHOLDER','VENDORPLACEHOLDER');
(async () => {
    await identity.fetchCSRF();
    await identity.closePosition(18105391, -0.01, 0, "US30.cash", 3351);
})();