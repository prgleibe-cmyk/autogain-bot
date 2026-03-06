import { io, Socket } from 'socket.io-client';

// URL vazia força o socket.io a usar a mesma origem (que será interceptada pelo Proxy do Vite)
const SOCKET_URL = '';

class SocketService {
    public socket: Socket | null = null;
    
    connect(onSignal: (data: any) => void, onStats: (data: any) => void) {
        if (this.socket) {
            // Se já estiver conectado, atualiza os listeners para evitar closures obsoletas
            this.socket.off('signal_alert');
            this.socket.off('stats_update');
            this.socket.on('signal_alert', onSignal);
            this.socket.on('stats_update', onStats);
            return;
        }

        this.socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        this.socket.on('connect', () => {
            console.log('[Socket] Conectado ao Cérebro Central');
        });

        this.socket.on('signal_alert', (data) => {
            console.log('[Socket] Sinal Recebido:', data);
            onSignal(data);
        });

        this.socket.on('stats_update', (data) => {
            onStats(data);
        });

        this.socket.on('disconnect', () => {
            console.log('[Socket] Desconectado');
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

export const socketService = new SocketService();