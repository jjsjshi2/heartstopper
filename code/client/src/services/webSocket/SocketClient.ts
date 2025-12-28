import GameSignals from "../../gameSignals/GameSignals";

class SocketClient {
  client: any;

  constructor() {
    this.client = this.createFakeClient();
    this.bindSignals();
  }

  // 假装连接成功
  public async connectWithServer() {
    console.log("[FAKE SOCKET] connected");
    return Promise.resolve();
  }

  // 假装监听服务器事件
  public setupServerListeners() {
    // 不需要做任何事
  }

  // ===== Fake Socket 实现 =====
  private createFakeClient() {
    const listeners: any = {};

    return {
      on: (event: string, cb: Function) => {
        listeners[event] = cb;
      },

      emit: (event: string, data?: any) => {
        console.log("[FAKE SOCKET EMIT]", event, data);

        // 模拟 spin 返回
        if (event === "spinAction") {
          setTimeout(() => {
            if (listeners["spinResult"]) {
              listeners["spinResult"](this.mockSpinResult());
            }
          }, 600);
        }

        // 模拟用户状态
        if (event === "getUserState") {
          setTimeout(() => {
            if (listeners["userState"]) {
              listeners["userState"]({
                balance: 10000,
                bet: 100,
              });
            }
          }, 300);
        }
      },
    };
  }

  private spinButtonClick(userData: any) {
    this.client.emit("spinAction", userData);
  }

  private getPlayerAndGameState(authToken: string | undefined) {
    this.client.emit("getUserState", authToken);
  }

  private bindSignals() {
    GameSignals.spinButtonClick.add((userData: any) =>
      this.spinButtonClick(userData)
    );
    GameSignals.getPlayerAndGameState.add((data: string | undefined) =>
      this.getPlayerAndGameState(data)
    );
  }

  private mockSpinResult() {
    const reels = 5;
    const rows = 3;
    const result: number[][] = [];

    for (let r = 0; r < reels; r++) {
      const reel: number[] = [];
      for (let i = 0; i < rows; i++) {
        reel.push(Math.floor(Math.random() * 8));
      }
      result.push(reel);
    }

    return {
      reels: result,
      win: Math.random() > 0.7,
      payout: Math.floor(Math.random() * 500),
    };
  }
}

export default SocketClient;