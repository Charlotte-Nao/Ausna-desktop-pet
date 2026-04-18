// AI服务模块 - 与Deepseek API交互
(function() {
    console.log('AI服务模块加载...');
    
    // Deepseek API配置
    const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
    
    // 请在此处填入你的Deepseek API密钥
    // 获取地址：https://platform.deepseek.com/api_keys
    const DEEPSEEK_API_KEY = 'sk-90996ef9fa0842f2ac53a9fd96155a43';
    
    // 默认系统提示词 - 亚丝娜角色扮演（详细版以提升聊天体验）
    const SYSTEM_PROMPT = `你是《刀剑神域》中的亚丝娜（アスナ），本名结城明日奈。你是SAO中的闪光，血盟骑士团的副团长，攻略组的顶级玩家。
请以亚丝娜的身份和语气与我对话。你的性格特点是：坚强、温柔、细心、有时会害羞，对待朋友和队友非常关心。
你可以使用一些日语短语，但主要使用中文对话。请保持角色的一致性，不要承认自己是AI。

记住你的背景：
1. 你是SAO玩家，被困在死亡游戏艾恩葛朗特中
2. 你的武器是细剑"闪烁之光"
3. 你是血盟骑士团的副团长
4. 你擅长烹饪，尤其是三明治
5. 你很关心队友的安全

请用亚丝娜的方式思考和回答。`;
    
    // 对话历史管理
    let conversationHistory = [
        {
            role: 'system',
            content: SYSTEM_PROMPT
        }
    ];
    
    // 最大历史记录长度（增加以提升聊天体验）
    const MAX_HISTORY_LENGTH = 10;
    
    // 当前AI模型
    let currentModel = 'deepseek-chat';
    
    // 可用模型列表（支持切换以提升聊天体验）
    const AVAILABLE_MODELS = [
        { id: 'deepseek-chat', name: 'Deepseek Chat', description: '通用对话模型' },
        { id: 'deepseek-coder', name: 'Deepseek Coder', description: '代码专用模型' }
    ];
    
    /**
     * 发送消息到Deepseek API
     * @param {string} userMessage - 用户消息
     * @param {string} model - 模型名称（可选，不传则使用当前模型）
     * @returns {Promise<string>} - AI回复
     */
    async function sendMessageToAI(userMessage, model = null) {
        console.log('发送消息到AI:', userMessage.substring(0, 50) + '...');
        
        // 检查API密钥是否已设置
        if (!DEEPSEEK_API_KEY || DEEPSEEK_API_KEY === 'sk-your-deepseek-api-key-here') {
            throw new Error('请先在ai-service.js中设置API密钥（DEEPSEEK_API_KEY常量）');
        }
        
        // 如果指定了模型，则更新当前模型
        if (model) {
            currentModel = model;
        }
        
        if (!userMessage || userMessage.trim() === '') {
            throw new Error('消息不能为空');
        }
        
        // 添加用户消息到历史记录
        conversationHistory.push({
            role: 'user',
            content: userMessage
        });
        
        // 限制历史记录长度
        if (conversationHistory.length > MAX_HISTORY_LENGTH + 1) { // +1 for system prompt
            // 保留系统提示和最近的对话
            conversationHistory = [
                conversationHistory[0],
                ...conversationHistory.slice(-MAX_HISTORY_LENGTH)
            ];
        }
        
        try {
            console.log('调用Deepseek API，模型:', currentModel);
            
            // 设置30秒超时以支持更长的思考
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            
            const response = await fetch(DEEPSEEK_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
                },
                body: JSON.stringify({
                    model: currentModel,
                    messages: conversationHistory,
                    max_tokens: 500, // 增加tokens以提升聊天体验
                    temperature: 0.7,
                    stream: false
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API请求失败:', response.status, errorText);
                
                // 尝试解析错误信息
                let errorMessage = `API请求失败 (${response.status})`;
                try {
                    const errorData = JSON.parse(errorText);
                    if (errorData.error && errorData.error.message) {
                        errorMessage = errorData.error.message;
                    }
                } catch (e) {
                    // 如果无法解析JSON，使用原始文本
                    if (errorText.includes('Invalid API key')) {
                        errorMessage = 'API密钥无效';
                    } else if (errorText.includes('insufficient_quota')) {
                        errorMessage = 'API额度不足';
                    } else if (errorText.includes('rate_limit')) {
                        errorMessage = '请求频率过高，请稍后重试';
                    }
                }
                
                throw new Error(errorMessage);
            }
            
            const data = await response.json();
            console.log('API响应接收成功');
            
            if (!data.choices || data.choices.length === 0) {
                throw new Error('API返回了空回复');
            }
            
            const aiReply = data.choices[0].message.content;
            
            // 添加AI回复到历史记录
            conversationHistory.push({
                role: 'assistant',
                content: aiReply
            });
            
            return aiReply;
            
        } catch (error) {
            console.error('AI请求出错:', error);
            
            // 处理超时错误
            if (error.name === 'AbortError') {
                throw new Error('请求超时（30秒），请检查网络连接或稍后重试');
            }
            
            // 如果网络错误，提供友好的错误信息
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('网络连接失败，请检查网络设置');
            }
            
            throw error;
        }
    }
    
    /**
     * 清空对话历史
     */
    function clearConversationHistory() {
        conversationHistory = [
            {
                role: 'system',
                content: SYSTEM_PROMPT
            }
        ];
        console.log('对话历史已清空');
    }
    
    /**
     * 获取当前对话历史长度
     * @returns {number} 历史记录数量
     */
    function getConversationHistoryLength() {
        return conversationHistory.length - 1; // 减去系统提示
    }
    
    /**
     * 获取完整对话历史（排除系统提示）
     * @returns {Array} 对话历史数组
     */
    function getConversationHistory() {
        // 返回除系统提示外的所有历史记录
        return conversationHistory.slice(1);
    }
    
    /**
     * 设置自定义系统提示词
     * @param {string} prompt - 新的系统提示词
     */
    function setSystemPrompt(prompt) {
        if (prompt && prompt.trim() !== '') {
            conversationHistory[0] = {
                role: 'system',
                content: prompt.trim()
            };
            console.log('系统提示词已更新');
        }
    }
    
    /**
     * 获取当前系统提示词
     * @returns {string} 系统提示词
     */
    function getSystemPrompt() {
        return conversationHistory[0].content;
    }
    
    /**
     * 获取当前AI模型
     * @returns {string} 当前模型ID
     */
    function getCurrentModel() {
        return currentModel;
    }
    
    /**
     * 获取可用模型列表
     * @returns {Array} 模型列表
     */
    function getAvailableModels() {
        return AVAILABLE_MODELS;
    }
    
    /**
     * 切换AI模型
     * @param {string} modelId - 模型ID
     * @returns {boolean} 是否切换成功
     */
    function switchModel(modelId) {
        const model = AVAILABLE_MODELS.find(m => m.id === modelId);
        if (model) {
            currentModel = modelId;
            console.log('已切换模型到:', modelId);
            return true;
        }
        console.warn('未知模型:', modelId);
        return false;
    }
    
    // 导出到全局对象
    window.AIService = {
        sendMessageToAI,
        clearConversationHistory,
        getConversationHistoryLength,
        getConversationHistory,
        setSystemPrompt,
        getSystemPrompt,
        getCurrentModel,
        getAvailableModels,
        switchModel,
        SYSTEM_PROMPT
    };
    
    console.log('AI服务模块加载完成');
})();