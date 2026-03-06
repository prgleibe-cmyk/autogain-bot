
import { WebSocket } from 'ws';
import axios from 'axios';

export class IqOptionDriver {
    constructor() {
        this.ws = null;
        this.ssid = null;
        this.isConnected = false;
        this.balance = 0;
        this.activeBalanceId = null;
        this.requests = new Map();
        this.instruments = []; 
        this.isReady = false;
        this._lastLogCount = 0;
        this._pingInterval = null;
    }

    async connect(credentials) {
        try {
            console.log(`\x1b[33m[IQ-Driver] Autenticando: ${credentials.email}\x1b[0m`);
            const response = await axios.post('https://auth.iqoption.com/api/v2/login', {
                identifier: credentials.email,
                password: credentials.password
            });

            if (response.data.code === 'success') {
                this.ssid = response.data.ssid;
                console.log(`\x1b[32m[IQ-Driver] SSID Obtido. Conectando ao cluster de dados...\x1b[0m`);
                return this.initWebSocket(credentials.type);
            }
            throw new Error(response.data.message || 'Falha na autenticação');
        } catch (e) {
            console.error(`\x1b[31m[IQ-Driver] Erro Login: ${e.message}\x1b[0m`);
            throw new Error(`Erro IQ: ${e.message}`);
        }
    }

    initWebSocket(targetType) {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket('wss://iqoption.com/echo/websocket');
            
            this.ws.on('open', () => {
                this.send({ name: 'ssid', msg: this.ssid });
                
                this._pingInterval = setInterval(() => {
                    this.send({ name: "heartbeat", msg: Date.now() });
                }, 5000);
            });

            this.ws.on('message', (data) => {
                const msg = JSON.parse(data);
                
                if (msg.name === 'profile') {
                    const typeId = targetType === 'REAL' ? 1 : 4;
                    const bal = msg.msg.balances.find(b => b.type === typeId);
                    if (bal) {
                        this.activeBalanceId = bal.id;
                        this.balance = bal.amount;
                        this.isConnected = true;
                        
                        console.log(`\x1b[34m[IQ-Driver] Conectado! Saldo: ${this.balance}\x1b[0m`);
                        console.log(`\x1b[35m[IQ-Driver] Forçando Sincronização de Instrumentos...\x1b[0m`);

                        // COMANDOS DE SUBSCONSTRUTOR (PROTOCOL 6.0)
                        // Precisamos de ambos para cobrir todos os ativos (Binárias e Digitais)
                        this.send({ name: "get-instruments", msg: { type: "turbo-option" } });
                        this.send({ name: "get-instruments", msg: { type: "binary-option" } });
                        this.send({ name: "get-instruments", msg: { type: "digital-option" } });
                        
                        // Handshake de inicialização obrigatório
                        this.send({ 
                            name: "get-initialization-data", 
                            msg: { version: "6.0", logic: "p" } 
                        });

                        resolve({ status: 'connected', balance: this.balance });
                    }
                }

                // PROCESSAMENTO DE INSTRUMENTOS (NOVO MÉTODO)
                if (msg.name === 'instruments' || msg.name === 'initialization-data' || msg.name === 'active-list') {
                    const found = [];
                    // A IQ pode enviar os ativos em msg.msg.instruments ou msg.msg.actives
                    const actives = msg.msg?.instruments || msg.msg?.actives || msg.msg;

                    if (Array.isArray(actives)) {
                        actives.forEach(item => {
                            if (item && (item.enabled || item.is_enabled)) {
                                let name = item.name || item.active_name || item.description;
                                if (!name) return;
                                let cleanName = name.toUpperCase();
                                if (item.is_otc || name.toLowerCase().includes('otc')) {
                                    if (!cleanName.includes('OTC')) cleanName += ' (OTC)';
                                }
                                found.push({ id: item.id || item.active_id, name: cleanName });
                            }
                        });
                    } else if (typeof actives === 'object') {
                        // Caso venha o objeto initialization-data com ramificações
                        ['binary', 'turbo', 'digital'].forEach(type => {
                            const list = actives[type]?.actives || actives[type];
                            if (list && typeof list === 'object') {
                                Object.values(list).forEach(item => {
                                    if (item && (item.enabled || item.is_enabled)) {
                                        let name = item.name || item.active_name;
                                        if (!name) return;
                                        let cleanName = name.toUpperCase();
                                        if (item.is_otc || name.toLowerCase().includes('otc')) {
                                            if (!cleanName.includes('OTC')) cleanName += ' (OTC)';
                                        }
                                        found.push({ id: item.id || item.active_id, name: cleanName });
                                    }
                                });
                            }
                        });
                    }

                    if (found.length > 0) {
                        const unique = new Map();
                        this.instruments.forEach(i => unique.set(i.name, i));
                        found.forEach(i => unique.set(i.name, i));
                        this.instruments = Array.from(unique.values());
                        
                        if (this.instruments.length > 0) {
                            this.isReady = true;
                            if (this.instruments.length !== this._lastLogCount) {
                                console.log(`\x1b[32m[IQ-Driver] SUCESSO: ${this.instruments.length} ativos capturados via subscrição.\x1b[0m`);
                                this._lastLogCount = this.instruments.length;
                            }
                        }
                    }
                }

                if (['option', 'binary-options.option-opened', 'digital-option-placed'].includes(msg.name)) {
                    if (this.requests.has(msg.request_id)) {
                        this.requests.get(msg.request_id)(msg.msg);
                        this.requests.delete(msg.request_id);
                    }
                }
            });

            this.ws.on('close', () => { 
                this.isConnected = false; 
                this.isReady = false;
                clearInterval(this._pingInterval);
            });
            this.ws.on('error', (err) => reject(err));
        });
    }

    async placeOrder(params) {
        if (!this.isConnected || !this.isReady) throw new Error("Aguarde a sincronização de ativos...");
        const asset = this.instruments.find(i => 
            i.name.replace(/[^A-Z]/g, '') === params.asset.replace(/[^A-Z]/g, '')
        );
        if (!asset) throw new Error(`Par ${params.asset} não disponível.`);
        const reqId = Date.now().toString();
        return new Promise((resolve, reject) => {
            const exp = Math.floor(Date.now() / 1000);
            const expiration = exp - (exp % 60) + 60;
            this.requests.set(reqId, (res) => {
                if (res.id || res.option_id) resolve({ id: res.id || res.option_id, payout: 80, status: 'open' });
                else reject(new Error(res.message || "Erro na execução"));
            });
            this.send({
                name: "binary-options.open-option",
                msg: {
                    active_id: asset.id,
                    option_type_id: 3, 
                    direction: params.action.toLowerCase(),
                    expired: expiration,
                    price: parseFloat(params.amount),
                    refund_value: 0
                },
                request_id: reqId
            });
        });
    }

    async getAssets() {
        return this.instruments.map(i => i.name);
    }

    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }
}
