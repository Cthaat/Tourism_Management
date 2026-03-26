Page({
  data: {
    showInitialPrompt: true,
    chatMode: "bot", // bot 表示使用agent，model 表示使用大模型，两种选一种配置即可
    agentConfig: {
      botId: "agent-kitty-2g43f4ubc7893079", // agent id
      tools: [
        {
          name: "get_weather",
          description: "获取指定城市的天气",
          parameters: {
            type: "object",
            properties: { city: { type: "string" } },
            required: ["city"],
          },
          // 同步函数示例
          handler: (params) => {
            const { city } = params;
            return `城市${city}的天气是晴朗的，温度是25摄氏度，无风`;
          }
        },
        {
          name: "get_location",
          description: "获取指定城市的经纬度",
          parameters: {
            type: "object",
            properties: { city: { type: "string" } },
            required: ["city"],
          },
          // 异步函数示例
          handler: async (params) => {
            const { city } = params;
            // 模拟网络延迟
            return new Promise((resolve) => {
              setTimeout(() => {
                resolve(`城市${city}的位置是东经114.305556度，北纬22.543056度`);
              }, 2000);
            });
          },
        },
      ],
    },
    modelConfig: {
      modelProvider: "hunyuan-open", // 大模型服务厂商
      quickResponseModel: "hunyuan-lite", // 大模型名称
      logo: "", // model 头像
      welcomeMsg: "欢迎语", // model 欢迎语
    },
  },

  handleChatSessionStart() {
    this.setData({ showInitialPrompt: false });
  }
})