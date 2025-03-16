const { LMStudioClient } = require('@lmstudio/sdk');

// LMStudio client configuration
class LLMClient {
    constructor() {
        this.client = new LMStudioClient({
            baseUrl: 'http://localhost:1234/v1'
        });
        this.modelName = "deepseek-r1-distill-qwen-7b";  // 指定模型名称
    }

    async generateSummary(text) {
        try {
            const response = await this.client.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "You are a professional assistant specialized in summarizing content. Please provide clear, concise summaries that capture the main points and key insights."
                    },
                    {
                        role: "user",
                        content: `Please summarize the following transcription in a structured way, highlighting the main points and key takeaways:\n\n${text}\n\nPlease format the summary with bullet points for main ideas.`
                    }
                ],
                model: this.modelName,
                temperature: 0.3,  // 降低温度以获得更确定性的输出
                max_tokens: 1000,  // 增加最大token以支持更长的总结
                top_p: 0.8,       // 添加top_p参数以提高输出质量
                frequency_penalty: 0.3  // 添加频率惩罚以避免重复
            });

            return response.choices[0].message.content;
        } catch (error) {
            console.error('Error generating summary:', error);
            const errorMessage = error.message || 'Unknown error';
            throw new Error(`Failed to generate summary: ${errorMessage}. Please ensure LM Studio is running and the model is properly loaded.`);
        }
    }

    async isServerAvailable() {
        try {
            const models = await this.client.models.list();
            // 检查是否有可用的模型
            if (models.length === 0) {
                throw new Error('No models available in LM Studio');
            }
            // 检查是否有我们需要的模型
            const hasDeepseek = models.some(model => 
                model.id.toLowerCase().includes('deepseek') || 
                model.id.toLowerCase().includes('qwen')
            );
            if (!hasDeepseek) {
                console.warn('Deepseek model not found, using available model:', models[0].id);
            }
            return true;
        } catch (error) {
            console.error('Server check error:', error);
            return false;
        }
    }

    // 新增方法：获取模型状态
    async getModelStatus() {
        try {
            const models = await this.client.models.list();
            return {
                available: models.length > 0,
                modelCount: models.length,
                models: models.map(m => m.id)
            };
        } catch (error) {
            return {
                available: false,
                error: error.message
            };
        }
    }
}

// Export the client
window.LLMClient = LLMClient; 