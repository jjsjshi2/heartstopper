import { io, Socket } from "socket.io-client";
import { WEBSOCKET_URL } from "../config";
import GameSignals from "../../gameSignals/GameSignals";

type ListenerMap = Record<string, Function[]>;

class SocketClient {
  private client: Socket | any = null;
  private isMock = false;

  constructor() {
    this.bindSignals();
  }

  public connectWithServer() {
    // GitHub Pages / 靜態站點：直接嘗試 websocket
    try {
      this.client = io(WEBSOCKET_URL, {
        transports: ["websocket"], // ❗禁止 polling（CORS 來源）
        timeout: 1500,
        reconnection: false        // ❗不要一直重試
      });

      this.client.on("connect", () => {
        console.log("✅ Connected to websocket server");
        this.setupServerListeners();
      });

      this.client.on("connect_error", (err: any) => {
        console.warn("❌ WebSocket failed, using mock", err);
        this.useLocalMock();
      });

    } catch (err) {
      console.warn("❌ WebSocket init error, using mock", err);
      this.useLocalMock();
    }
  }

  // =========================
  // 🔁 Local Mock Server
  // =========================
  private useLocalMock() {
    if (this.isMock) return; // ❗避免重複建立

    this.isMock = true;
    console.log("🟡 Using local mock socket");

    const listeners: ListenerMap = {};

    this.client = {
      connected: true,

      on: (event: string, cb: Function) => {
        listeners[event] = listeners[event] || [];
        listeners[event].push(cb);
      },

      emit: (event: string, data?: any) => {
        // 模擬 spin
        if (event === "spinAction") {
          const result = {
            reels: [
              Math.floor(Math.random() * 5),
              Math.floor(Math.random() * 5),
              Math.floor(Math.random() * 5)
            ]
          };

          setTimeout(() => {
            listeners["spinResult"]?.forEach(cb => cb(result));
          }, 300);
        }

        // 模擬玩家狀態
        if (event === "getUserState") {
          const mockState = {
            balance: 9999,
            bet: 10
          };

          setTimeout(() => {
            listeners["userState"]?.forEach(cb => cb(mockState));
          }, 200);
        }
      }
    };

    this.setupServerListeners();
  }

  // =========================
  // 📡 Server listeners
  // =========================
  private setupServerListeners() {
    this.client.on("userState", (data: any) => {
      GameSignals.onPlayerAndGameState.dispatch(data);
    });

    this.client.on("updateGameData", (data: any) => {
      GameSignals.onUpdateGameData.dispatch(data);
    });

    this.client.on("spinResult", (data: any) => {
      GameSignals.onUpdateGameData.dispatch(data);
    });
  }

  // =========================
  // 🎮 Actions
  // =========================
  private spinButtonClick(userData: any) {
    this.client?.emit("spinAction", userData);
  }

  private getPlayerAndGameState(authToken: string | undefined) {
    this.client?.emit("getUserState", authToken);
  }

  // =========================
  // 🔗 Bind signals
  // =========================
  private bindSignals() {
    GameSignals.spinButtonClick.add((userData: any) =>
      this.spinButtonClick(userData)
    );

    GameSignals.getPlayerAndGameState.add((token: string | undefined) =>
      this.getPlayerAndGameState(token)
    );
  }
}

export default new SocketClient();
