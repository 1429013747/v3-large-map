export class WebSocketUtils {
    /**
     * 初始化带重连和心跳的WebSocket
     * @param {string} url - WebSocket连接地址（ws://或wss://）
     * @param {Object} options - 配置项
     * @param {number} options.maxReconnectAttempts - 最大重连次数（默认无限次）
     * @param {number} options.initialReconnectDelay - 初始重连延迟（毫秒，默认1000）
     * @param {number} options.maxReconnectDelay - 最大重连延迟（毫秒，默认5000）
     * @param {number} options.heartbeatInterval - 心跳发送间隔（毫秒，默认30000）
     * @param {number} options.heartbeatTimeout - 心跳超时时间（毫秒，默认10000）
     * @param {any} options.heartbeatMessage - 心跳包内容（默认{ type: 'heartbeat' }）
     */
    constructor(url, options = {}) {
        this.url = url;
        this.ws = null; // WebSocket实例
        this.isConnected = false; // 连接状态

        // 重连相关配置
        this.reconnectAttempts = 0;
        this.reconnectTimer = null;
        this.maxReconnectAttempts = options.maxReconnectAttempts ?? Infinity;
        this.initialReconnectDelay = options.initialReconnectDelay ?? 1000;
        this.maxReconnectDelay = options.maxReconnectDelay ?? 5000;

        // 心跳相关配置
        this.heartbeatInterval = options.heartbeatInterval ?? 30000; // 30秒发一次心跳
        this.heartbeatTimeout = options.heartbeatTimeout ?? 10000; // 10秒内没响应则视为断线
        this.heartbeatMessage = options.heartbeatMessage ?? { type: 'ping' }; // 心跳包内容
        this.heartbeatTimer = null; // 心跳发送定时器
        this.heartbeatTimeoutTimer = null; // 心跳超时定时器
        this.isHeartbeatReceived = false; // 是否收到服务器心跳响应

        // 事件回调
        this.onOpen = () => { };
        this.onMessage = (event) => { };
        this.onClose = (event) => { };
        this.onError = (error) => { };
        this.onReconnect = (attempt) => { };
        this.onHeartbeatTimeout = () => { }; // 心跳超时回调

        // 初始化连接
        this.connect();
    }

    /**
     * 建立WebSocket连接
     */
    connect() {
        // 关闭已有连接和定时器
        this.cleanup();

        // 创建新连接
        this.ws = new WebSocket(this.url);

        // 连接成功
        this.ws.onopen = (event) => {
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.onOpen(event);
            // 启动心跳检测
            this.startHeartbeat();
        };

        // 接收消息
        this.ws.onmessage = (event) => {
            // 触发外部消息回调
            this.onMessage(event);

            try {
                const data = JSON.parse(event.data);
                if (data.type === 'pong') {
                    this.isHeartbeatReceived = true;
                }

            } catch (e) {
                // 非JSON消息不处理
            }
        };

        // 连接关闭
        this.ws.onclose = (event) => {
            this.isConnected = false;
            this.onClose(event);
            this.cleanupHeartbeat(); // 清除心跳定时器

            // 非主动关闭且未达最大重连次数，触发重连
            if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnect();
            }
        };

        // 连接错误
        this.ws.onerror = (error) => {
            this.onError(error);
        };
    }

    /**
     * 启动心跳检测
     */
    startHeartbeat() {
        // 清除可能存在的旧定时器
        this.cleanupHeartbeat();

        // 定时发送心跳包
        this.heartbeatTimer = setInterval(() => {
            if (this.isConnected) {
                // 发送心跳包
                this.send(this.heartbeatMessage);
                // 重置心跳响应状态
                this.isHeartbeatReceived = false;

                // 启动超时检测：如果指定时间内没收到响应，视为断线
                this.heartbeatTimeoutTimer = setTimeout(() => {
                    if (!this.isHeartbeatReceived) {
                        this.onHeartbeatTimeout(); // 触发心跳超时回调
                        this.ws.close(4001, '心跳超时'); // 主动关闭连接（4001为自定义错误码）
                    }
                }, this.heartbeatTimeout);
            }
        }, this.heartbeatInterval);
    }

    /**
     * 清除心跳相关定时器
     */
    cleanupHeartbeat() {
        clearInterval(this.heartbeatTimer);
        clearTimeout(this.heartbeatTimeoutTimer);
        this.heartbeatTimer = null;
        this.heartbeatTimeoutTimer = null;
    }

    /**
     * 重连逻辑（延迟递增）
     */
    reconnect() {
        this.reconnectAttempts++;
        const delay = Math.min(
            this.initialReconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
            this.maxReconnectDelay
        );

        this.onReconnect(this.reconnectAttempts, delay); // 触发重连回调
        this.reconnectTimer = setTimeout(() => this.connect(), delay);
    }

    /**
     * 发送消息
     * @param {string|Object} data - 发送的数据（对象自动转为JSON）
     */
    send(data) {
        if (!this.isConnected) {
            throw new Error('WebSocket未连接，无法发送消息');
        }
        const sendData = typeof data === 'object' ? JSON.stringify(data) : data;
        this.ws.send(sendData);
    }

    /**
     * 手动关闭连接（不触发重连）
     */
    close() {
        this.cleanup();
        if (this.ws) {
            this.ws.close(1000, '手动关闭');
        }
        this.isConnected = false;
    }

    /**
     * 清除所有定时器和状态
     */
    cleanup() {
        this.cleanupHeartbeat();
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
    }
}