// 独立AI窗口的JavaScript逻辑
(function() {
    console.log('独立AI窗口加载...');
    
    const { ipcRenderer } = require('electron');
    
    // DOM元素
    let aiInput, aiSendBtn, aiCloseBtn, aiMessages;
    
    // 初始化函数
    function init() {
        console.log('初始化AI窗口...');
        
        // 获取DOM元素
        aiInput = document.getElementById('ai-input');
        aiSendBtn = document.getElementById('ai-send-btn');
        const closeBtn = document.getElementById('close-btn');
        const dragHandle = document.querySelector('.drag-handle');
        
        if (!aiInput || !aiSendBtn) {
            console.error('必需的DOM元素未找到');
            return;
        }
        
        // 设置事件监听器
        setupEventListeners();
        
        // 关闭按钮事件
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                window.close();
            });
        }
        
        // 拖动事件
        if (dragHandle) {
            setupDragEvents(dragHandle);
        }
        
        // 自动聚焦输入框
        setTimeout(() => {
            aiInput.focus();
        }, 100);
        
        console.log('AI窗口初始化完成');
    }
    
    // 设置事件监听器
    function setupEventListeners() {
        // 发送按钮点击事件
        aiSendBtn.addEventListener('click', sendAIMessage);
        
        // 输入框键盘事件（Enter发送，ESC关闭，Shift+Enter换行）
        aiInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendAIMessage();
            }
            
            // ESC键关闭窗口
            if (e.key === 'Escape') {
                window.close();
            }
        });
        
        // 点击窗口外部关闭（通过主窗口的点击事件处理）
        
        // IPC监听器：清空AI历史
        ipcRenderer.on('clear-ai-history', () => {
            console.log('收到清空AI历史请求');
            clearConversationHistory();
        });
        
        // IPC监听器：切换AI模型
        ipcRenderer.on('switch-ai-model', () => {
            console.log('收到切换AI模型请求');
            switchAIModel();
        });
        
        // IPC监听器：获取AI历史记录
        ipcRenderer.on('get-ai-history', () => {
            console.log('收到获取AI历史记录请求');
            if (window.AIService && window.AIService.getConversationHistory) {
                const history = window.AIService.getConversationHistory();
                console.log('发送AI历史记录:', history.length, '条记录');
                ipcRenderer.send('return-ai-history', history);
            } else {
                console.log('AI服务未加载，返回空历史记录');
                ipcRenderer.send('return-ai-history', []);
            }
        });
    }
    
    // 发送AI消息
    async function sendAIMessage() {
        const message = aiInput.value.trim();
        if (!message) {
            return;
        }
        
        // 禁用发送按钮和输入框
        aiSendBtn.disabled = true;
        aiInput.disabled = true;
        aiSendBtn.textContent = '发送中...';
        
        // 清空输入框
        aiInput.value = '';
        
        try {
            console.log('发送AI消息:', message.substring(0, 50) + '...');
            
            // 检查AI服务是否已加载
            if (!window.AIService || !window.AIService.sendMessageToAI) {
                throw new Error('AI服务未加载，请刷新窗口重试');
            }
            
            // 调用AI服务
            const reply = await window.AIService.sendMessageToAI(message);
            
            // 发送AI回复到主进程，显示在气泡中
            ipcRenderer.send('show-ai-reply', reply);
            
            console.log('AI回复成功，已发送到主窗口显示');
            
        } catch (error) {
            console.error('AI消息发送失败:', error);
            
            // 发送错误消息到主进程
            ipcRenderer.send('show-ai-reply', `对话失败: ${error.message}`);
            
        } finally {
            // 重新启用发送按钮和输入框
            aiSendBtn.disabled = false;
            aiInput.disabled = false;
            aiSendBtn.textContent = '发送';
            
            // 重新聚焦到输入框
            setTimeout(() => {
                aiInput.focus();
            }, 50);
        }
    }
    
    // 添加消息到对话框
    function addMessage(content, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-message ${isUser ? 'ai-user' : 'ai-assistant'}`;
        
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'ai-avatar';
        avatarDiv.textContent = isUser ? '你' : 'A';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'ai-content';
        contentDiv.textContent = content;
        
        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);
        aiMessages.appendChild(messageDiv);
        
        // 滚动到底部
        aiMessages.scrollTop = aiMessages.scrollHeight;
    }
    
    // 清空对话历史（用于右键菜单）
    function clearConversationHistory() {
        // 清空AI服务的历史记录
        if (window.AIService && window.AIService.clearConversationHistory) {
            window.AIService.clearConversationHistory();
            console.log('AI对话历史已清空');
            // 发送消息到主窗口显示确认信息
            ipcRenderer.send('show-ai-reply', '对话历史已清空');
        } else {
            console.error('AI服务未加载');
        }
    }
    
    // 设置拖动事件
    function setupDragEvents(dragHandle) {
        let isDragging = false;
        let lastMouseX = 0;
        let lastMouseY = 0;
        
        dragHandle.addEventListener('mousedown', (e) => {
            isDragging = true;
            lastMouseX = e.screenX;
            lastMouseY = e.screenY;
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaX = e.screenX - lastMouseX;
            const deltaY = e.screenY - lastMouseY;
            
            if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
                // 发送拖动事件到主进程
                ipcRenderer.send('ai-window-drag', { x: deltaX, y: deltaY });
                
                lastMouseX = e.screenX;
                lastMouseY = e.screenY;
            }
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }
    
    // 切换AI模型（用于右键菜单）
    function switchAIModel() {
        if (window.AIService && window.AIService.getAvailableModels && window.AIService.switchModel) {
            const models = window.AIService.getAvailableModels();
            const currentModel = window.AIService.getCurrentModel();
            
            // 找到当前模型索引
            const currentIndex = models.findIndex(m => m.id === currentModel);
            const nextIndex = (currentIndex + 1) % models.length;
            const nextModel = models[nextIndex];
            
            // 切换模型
            const success = window.AIService.switchModel(nextModel.id);
            
            if (success) {
                console.log(`已切换AI模型到: ${nextModel.name}`);
                // 发送消息到主窗口显示切换结果
                ipcRenderer.send('show-ai-reply', `已切换AI模型: ${nextModel.name}\n${nextModel.description}`);
            } else {
                console.error('切换模型失败');
                ipcRenderer.send('show-ai-reply', '切换AI模型失败');
            }
        } else {
            console.error('AI服务未加载或缺少必要方法');
            ipcRenderer.send('show-ai-reply', 'AI服务未加载');
        }
    }
    
    // 导出函数到全局对象（供主窗口调用）
    window.AIWindow = {
        clearConversationHistory,
        switchAIModel
    };
    
    // 当DOM加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();