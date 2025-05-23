import { io } from 'socket.io-client';

class SocketService {
    constructor() {
        this.socket = null;
        this.listeners = new Map();
    }

    connect() {
        if (!this.socket) {
            this.socket = io('http://localhost:5000', {
                withCredentials: true
            });

            this.socket.on('connect', () => {
                console.log('Connected to Socket.IO server');
            });

            this.socket.on('disconnect', () => {
                console.log('Disconnected from Socket.IO server');
            });
        }
    }

    joinRoom(managerId) {
        if (this.socket) {
            this.socket.emit('join-room', managerId);
        }
    }

    onNewBooking(callback) {
        if (this.socket) {
            this.socket.on('new-booking', callback);
            this.listeners.set('new-booking', callback);
        }
    }

    removeListener(event) {
        if (this.socket && this.listeners.has(event)) {
            const callback = this.listeners.get(event);
            this.socket.off(event, callback);
            this.listeners.delete(event);
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.listeners.clear();
        }
    }
}

export default new SocketService(); 