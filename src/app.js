(function() {
    console.log('动态脚本加载开始...');
    console.log('$ 已定义?', typeof $);
    
// 拖拽状态跟踪变量 - 全局可访问
window.lastDragEndTime = 0;

// 控制按钮状态跟踪 - 全局可访问  
window.controlsEnabled = false;

console.log('全局变量初始化: lastDragEndTime =', window.lastDragEndTime, 'controlsEnabled =', window.controlsEnabled);
    
    if (typeof $ !== 'undefined') {
        console.log('jQuery 已加载，跳过加载');
        loadRemainingScripts();
        return;
    }
    
    const jquerySrc = window.__resourceRoot ? 
        window.__resourceRoot + '/js/jquery.min.js' : 
        '../resources/js/jquery.min.js';
    
    console.log('加载jQuery:', jquerySrc);
    
    const script = document.createElement('script');
    script.src = jquerySrc;
    script.onload = function() {
        console.log('jQuery加载成功, $:', typeof $);
        if (typeof $ !== 'undefined') {
            console.log('jQuery版本:', $.fn.jquery);
        }
        loadRemainingScripts();
    };
    script.onerror = function(e) {
        console.error('jQuery加载失败:', e);
        setTimeout(() => {
            console.log('尝试使用相对路径加载...');
            const fallbackScript = document.createElement('script');
            fallbackScript.src = '../resources/js/jquery.min.js';
            fallbackScript.onload = function() {
                console.log('jQuery回退加载成功');
                loadRemainingScripts();
            };
            fallbackScript.onerror = function() {
                console.error('jQuery回退加载也失败');
                loadRemainingScripts();
            };
            document.head.appendChild(fallbackScript);
        }, 100);
    };
    
    function loadRemainingScripts() {
        const scripts = [
            '../resources/js/live2d.min.js',
            '../resources/js/live2d-helper.min.js',
            '../resources/js/Live2D.js'
        ];
        
        function loadScript(index) {
            if (index >= scripts.length) {
                console.log('所有脚本加载完成');
                initializeDesktopPetAfterLoad();
                return;
            }
            
            const src = scripts[index];
            const s = document.createElement('script');
            s.src = src;
            s.onload = function() {
                console.log('脚本加载成功:', src);
                loadScript(index + 1);
            };
            s.onerror = function(e) {
                console.error('脚本加载失败:', src, e);
                loadScript(index + 1);
            };
            document.head.appendChild(s);
        }
        
        loadScript(0);
    }
    
    function initializeDesktopPetAfterLoad() {
        console.log('开始初始化桌面宠物...');
        console.log('检查全局变量: initializeDesktopPet =', typeof window.initializeDesktopPet, 'setupEventListeners =', typeof window.setupEventListeners);
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                console.log('DOMContentLoaded触发，再次检查全局变量');
                if (window.initializeDesktopPet && window.setupEventListeners) {
                    console.log('调用initializeDesktopPet和setupEventListeners');
                    window.initializeDesktopPet();
                    window.setupEventListeners();
                } else {
                    console.error('全局函数未定义: initializeDesktopPet =', !!window.initializeDesktopPet, 'setupEventListeners =', !!window.setupEventListeners);
                }
            });
        } else {
            if (window.initializeDesktopPet && window.setupEventListeners) {
                console.log('DOM已就绪，直接调用');
                window.initializeDesktopPet();
                window.setupEventListeners();
            } else {
                console.error('全局函数未定义: initializeDesktopPet =', !!window.initializeDesktopPet, 'setupEventListeners =', !!window.setupEventListeners);
            }
        }
    }
    
    document.head.appendChild(script);
})();

        const { ipcRenderer } = require('electron');
        

        
        // 初始化桌面宠物 - 加载Live2D模型和高级功能
        function initializeDesktopPet() {
            console.log('初始化桌面宠物...');
            
            // 获取可用服装列表，优先使用02号服装
            const costumes = getAvailableCostumes();
            let defaultCostume = '02';
            
            // 检查02是否在可用服装列表中，如果不在则使用第一个可用服装
            if (!costumes.includes('02') && costumes.length > 0) {
                defaultCostume = costumes[0];
                console.warn('02号服装不可用，使用默认服装:', defaultCostume);
            }
            
            window.currentCostume = defaultCostume;
            
            setTimeout(() => {
                console.log('加载Live2D模型 asuna_' + defaultCostume);
                initLive2D(defaultCostume);
                initAdvancedFeatures();
            }, 500);
        }
        window.initializeDesktopPet = initializeDesktopPet;

        // 设置事件监听器 - 处理拖拽、右键菜单、控制按钮等
        function setupEventListeners() {
            const container = document.getElementById('container');
            const canvas = document.getElementById('glcanvas');
            const contextMenu = document.getElementById('context-menu');
            const controls = document.getElementById('controls');
            
            // 初始化控制按钮显示状态
            controls.style.display = window.controlsEnabled ? 'flex' : 'none';
            updateContextMenuLabel('show-controls', window.controlsEnabled ? '隐藏控制按钮' : '显示控制按钮');
            console.log('控制按钮初始化: controlsEnabled =', window.controlsEnabled, 'display =', controls.style.display);
            
            let isDragging = false;
            let mouseDown = false;
            let dragStartX = 0;
            let dragStartY = 0;
            const DRAG_THRESHOLD = 5;
            
            container.addEventListener('mousedown', (e) => {
                if (e.button === 0) {
                    mouseDown = true;
                    dragStartX = e.screenX;
                    dragStartY = e.screenY;
                } else if (e.button === 2) {
                    e.preventDefault();
                    showContextMenu(e.clientX, e.clientY);
                }
            });
            
            document.addEventListener('mousemove', (e) => {
                if (mouseDown && !isDragging) {
                    const deltaX = e.screenX - dragStartX;
                    const deltaY = e.screenY - dragStartY;
                    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                    if (distance >= DRAG_THRESHOLD) {
                        isDragging = true;
                        console.log('开始拖拽，距离:', distance);
                    }
                }
                if (isDragging) {
                    const deltaX = e.screenX - dragStartX;
                    const deltaY = e.screenY - dragStartY;
                    
                    ipcRenderer.send('window-drag', { x: deltaX, y: deltaY });
                    
                    dragStartX = e.screenX;
                    dragStartY = e.screenY;
                }
            });
            
            document.addEventListener('mouseup', () => {
                if (isDragging) {
                    window.lastDragEndTime = Date.now();
                    console.log('拖拽结束，设置最后拖拽时间:', window.lastDragEndTime);
                } else if (mouseDown) {
                    console.log('鼠标点击（未拖拽）');
                }
                isDragging = false;
                mouseDown = false;
            });
            
            document.addEventListener('contextmenu', (e) => {
                e.preventDefault();
            });
            
            // 全局鼠标按下事件 - 检查点击是否在菜单外部
            document.addEventListener('mousedown', (e) => {
                const contextMenu = document.getElementById('context-menu');
                if (contextMenu.style.display === 'block') {
                    // 检查点击是否在菜单内部
                    const menuRect = contextMenu.getBoundingClientRect();
                    const isClickInsideMenu = 
                        e.clientX >= menuRect.left && e.clientX <= menuRect.right &&
                        e.clientY >= menuRect.top && e.clientY <= menuRect.bottom;
                    
                    // 如果点击在菜单外部，隐藏菜单
                    if (!isClickInsideMenu) {
                        hideContextMenu();
                    }
                }
            });
            
            // 窗口失去焦点时隐藏菜单
            window.addEventListener('blur', () => {
                hideContextMenu();
            });
            
            // 鼠标离开窗口时隐藏菜单
            window.addEventListener('mouseleave', () => {
                hideContextMenu();
            });
            

            
            document.getElementById('btn-close').addEventListener('click', () => {
                ipcRenderer.send('close-window');
            });
            
            document.getElementById('btn-minimize').addEventListener('click', () => {
                ipcRenderer.send('minimize-window');
            });
            
            document.getElementById('btn-pin').addEventListener('click', () => {
                ipcRenderer.send('toggle-always-on-top');
                const btn = document.getElementById('btn-pin');
                btn.textContent = btn.textContent === '📌' ? '📎' : '📌';
            });
            
            document.querySelectorAll('.menu-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    const action = e.target.getAttribute('data-action');
                    handleContextMenuAction(action);
                    hideContextMenu();
                });
            });
            
            container.addEventListener('mouseenter', () => {
                if (window.controlsEnabled) {
                    controls.style.display = 'flex';
                }
            });
            
            container.addEventListener('mouseleave', () => {
                if (window.controlsEnabled) {
                    controls.style.display = 'none';
                }
            });
            
            // AI按钮事件监听器
            const aiBtn = document.getElementById('btn-ai');
            if (aiBtn) {
                aiBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showAIDialog();
                });
            }
            
            // 设置AI对话框事件监听器
            setupAIDialogListeners();
        }
        window.setupEventListeners = setupEventListeners;

        // 显示右键菜单 - 参数x,y为菜单显示坐标
        function showContextMenu(x, y) {
            const contextMenu = document.getElementById('context-menu');
            contextMenu.style.left = x + 'px';
            contextMenu.style.top = y + 'px';
            contextMenu.style.display = 'block';
            console.log('显示右键菜单 at', x, y);
        }
        
        // 隐藏右键菜单
        function hideContextMenu() {
            const contextMenu = document.getElementById('context-menu');
            if (contextMenu.style.display === 'block') {
                console.log('隐藏右键菜单');
            }
            contextMenu.style.display = 'none';
        }
        
        // 处理右键菜单选项 - 根据action执行相应操作
        function handleContextMenuAction(action) {
            switch(action) {
                case 'fortune':
                    playFortune();
                    break;
                case 'change-costume':
                    changeCostume();
                    break;
                case 'always-on-top':
                    ipcRenderer.send('toggle-always-on-top');
                    break;
                case 'show-controls':
                    toggleControls();
                    break;
                case 'exit':
                    ipcRenderer.send('close-window');
                    break;
                case 'ai-chat':
                    showAIDialog();
                    break;
                case 'ai-clear-history':
                    clearAIConversation();
                    break;
                case 'ai-view-history':
                    showAIHistory();
                    break;
                case 'ai-switch-model':
                    switchAIModel();
                    break;
            }
        }
        
        // AI对话框函数 - 打开独立窗口
        function showAIDialog() {
            console.log('请求打开AI独立窗口');
            ipcRenderer.send('open-ai-window');
        }
        
        function hideAIDialog() {
            const dialog = document.getElementById('ai-dialog');
            if (dialog) {
                dialog.style.display = 'none';
                console.log('隐藏AI对话框');
            }
        }
        
        // 添加消息到对话框
        function addAIMessage(content, isUser = false) {
            const messagesContainer = document.getElementById('ai-messages');
            if (!messagesContainer) return;
            
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
            messagesContainer.appendChild(messageDiv);
            
            // 滚动到底部
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        
        // 发送AI消息
        async function sendAIMessage() {
            const input = document.getElementById('ai-input');
            const sendBtn = document.getElementById('ai-send-btn');
            
            if (!input || !sendBtn) {
                console.error('AI对话框元素未找到');
                return;
            }
            
            const message = input.value.trim();
            if (!message) {
                return;
            }
            
            // 禁用发送按钮和输入框
            sendBtn.disabled = true;
            input.disabled = true;
            sendBtn.textContent = '发送中...';
            
            // 清空输入框
            input.value = '';
            
            try {
                console.log('发送AI消息:', message.substring(0, 50) + '...');
                
                // 检查AI服务是否已加载
                if (!window.AIService || !window.AIService.sendMessageToAI) {
                    throw new Error('AI服务未加载，请刷新页面重试');
                }
                
                // 调用AI服务
                const reply = await window.AIService.sendMessageToAI(message);
                
                // 显示AI回复在气泡中
                showSpeechBubble(reply, 5000);
                
                console.log('AI回复成功');
                
            } catch (error) {
                console.error('AI消息发送失败:', error);
                
                // 在气泡中显示错误
                showSpeechBubble(`对话失败: ${error.message}`, 3000);
                
            } finally {
                // 重新启用发送按钮和输入框
                sendBtn.disabled = false;
                input.disabled = false;
                sendBtn.textContent = '发送';
                
                // 重新聚焦到输入框
                input.focus();
            }
        }
        
        // 清空AI对话历史
        function clearAIConversation() {
            // 发送清空历史请求到主进程（转发到AI窗口）
            ipcRenderer.send('clear-ai-history');
            
            const messagesContainer = document.getElementById('ai-messages');
            if (messagesContainer) {
                // 保留第一条欢迎消息
                const welcomeMessage = messagesContainer.querySelector('.ai-message.ai-assistant');
                messagesContainer.innerHTML = '';
                if (welcomeMessage) {
                    messagesContainer.appendChild(welcomeMessage);
                } else {
                    // 如果没有欢迎消息，添加一个
                    addAIMessage('你好！我是亚丝娜，有什么可以帮助你的吗？', false);
                }
                
                // 清空AI服务的历史记录
                if (window.AIService && window.AIService.clearConversationHistory) {
                    window.AIService.clearConversationHistory();
                }
                
                console.log('AI对话历史已清空');
                showSpeechBubble('对话历史已清空', 2000);
            }
        }
        
        // 查看AI对话历史
        function showAIHistory() {
            console.log('请求AI对话历史');
            // 通过IPC请求AI窗口的历史记录
            ipcRenderer.send('get-ai-history');
        }
        
        // 显示AI历史记录（由IPC事件触发）
        function displayAIHistory(history) {
            if (!history || history.length === 0) {
                showSpeechBubble('暂无对话历史', 3000);
                return;
            }
            
            // 构建历史记录文本
            let historyText = '对话历史:\n\n';
            history.forEach((msg, index) => {
                const role = msg.role === 'user' ? '你' : '亚丝娜';
                const content = msg.content.length > 50 ? msg.content.substring(0, 50) + '...' : msg.content;
                historyText += `${index + 1}. ${role}: ${content}\n`;
            });
            
            showSpeechBubble(historyText, 5000);
        }
        
        // 切换AI模型
        function switchAIModel() {
            console.log('切换AI模型请求');
            // 发送切换模型请求到主进程（转发到AI窗口）
            ipcRenderer.send('switch-ai-model');
            // 显示等待消息
            showSpeechBubble('正在切换AI模型...', 2000);
        }
        
        // 设置AI对话框事件监听器
        function setupAIDialogListeners() {
            const dialog = document.getElementById('ai-dialog');
            const closeBtn = document.getElementById('ai-close-btn');
            const sendBtn = document.getElementById('ai-send-btn');
            const input = document.getElementById('ai-input');
            const clearBtn = document.getElementById('ai-clear-btn');
            
            if (!dialog || !closeBtn || !sendBtn || !input) {
                console.log('AI对话框元素未找到，跳过设置监听器');
                return;
            }
            
            // 关闭按钮
            closeBtn.addEventListener('click', hideAIDialog);
            
            // 发送按钮
            sendBtn.addEventListener('click', sendAIMessage);
            
            // 输入框回车发送（Ctrl+Enter或Cmd+Enter）
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    sendAIMessage();
                }
            });
            
            // 点击对话框外部关闭
            dialog.addEventListener('mousedown', (e) => {
                if (e.target === dialog) {
                    hideAIDialog();
                }
            });
            
            // 阻止对话框内部点击事件冒泡
            const dialogBody = dialog.querySelector('.ai-dialog-body');
            if (dialogBody) {
                dialogBody.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                });
            }
            
            // 清空按钮
            if (clearBtn) {
                clearBtn.addEventListener('click', clearAIConversation);
            }
            
            console.log('AI对话框事件监听器已设置');
        }
        
        // 播放运势占卜音频
        function playFortune() {
            console.log('播放运势占卜');
            playRandomAudio('fortune');
        }
        
        // 获取可用服装列表 - 动态扫描models目录
        function getAvailableCostumes() {
            try {
                const fs = require('fs');
                const path = require('path');
                
                const modelsPath = path.resolve(__dirname, '..', 'resources', 'models');
                console.log('扫描服装目录:', modelsPath);
                
                if (!fs.existsSync(modelsPath)) {
                    console.error('models目录不存在:', modelsPath);
                    return ['02']; // 默认服装
                }
                
                const items = fs.readdirSync(modelsPath);
                const costumes = [];
                
                for (const item of items) {
                    const itemPath = path.join(modelsPath, item);
                    const isDirectory = fs.statSync(itemPath).isDirectory();
                    
                    // 匹配 asuna_01, asuna_02 等模式
                    if (isDirectory && item.startsWith('asuna_')) {
                        const costumeNumber = item.replace('asuna_', '');
                        // 确保是数字（01, 02等）
                        if (/^\d+$/.test(costumeNumber)) {
                            costumes.push(costumeNumber);
                        }
                    }
                }
                
                // 按数字排序
                costumes.sort((a, b) => parseInt(a) - parseInt(b));
                
                console.log('找到服装:', costumes);
                
                if (costumes.length === 0) {
                    console.warn('未找到服装，使用默认服装02');
                    return ['02'];
                }
                
                return costumes;
            } catch(e) {
                console.error('获取服装列表失败:', e);
                return ['02']; // 默认服装
            }
        }
        
        // 切换服装 - 动态获取可用模型列表
        function changeCostume() {
            console.log('切换服装');
            const costumes = getAvailableCostumes();
            
            if (costumes.length === 0) {
                console.error('没有可用的服装');
                showSpeechBubble('没有可用的服装', 2000);
                return;
            }
            
            const current = window.currentCostume || costumes[0];
            let currentIndex = costumes.indexOf(current);
            
            // 如果当前服装不在列表中，使用第一个
            if (currentIndex === -1) {
                currentIndex = 0;
                window.currentCostume = costumes[0];
            }
            
            // 循环到下一个服装
            const nextIndex = (currentIndex + 1) % costumes.length;
            const nextCostume = costumes[nextIndex];
            
            console.log('尝试切换服装到:', nextCostume, '可用服装:', costumes);
            
            try {
                if (window.live2DHelper && window.initLive2D) {
                    window.live2DHelper = null;
                    initLive2D(nextCostume);
                    window.currentCostume = nextCostume;
                    showSpeechBubble(`切换服装: ${nextCostume}`, 2000);
                }
            } catch(e) {
                console.error('切换服装失败:', e);
                showSpeechBubble('切换失败，使用默认服装', 2000);
                // 尝试切换到第一个可用服装
                if (costumes.length > 0) {
                    initLive2D(costumes[0]);
                    window.currentCostume = costumes[0];
                }
            }
        }
        
        // 切换控制按钮显示/隐藏
        function toggleControls() {
            const controls = document.getElementById('controls');
            window.controlsEnabled = !window.controlsEnabled;
            
            if (window.controlsEnabled) {
                controls.style.display = 'flex';
                updateContextMenuLabel('show-controls', '隐藏控制按钮');
                console.log('控制按钮已启用');
            } else {
                controls.style.display = 'none';
                updateContextMenuLabel('show-controls', '显示控制按钮');
                console.log('控制按钮已禁用');
            }
        }
        
        // 更新右键菜单项标签
        function updateContextMenuLabel(action, label) {
            const menuItem = document.querySelector(`.menu-item[data-action="${action}"]`);
            if (menuItem) {
                menuItem.textContent = label;
            }
        }
        
        // 显示气泡消息 - text: 显示文本, duration: 显示时长(毫秒)
        // 气泡样式在CSS中定义，如需调整大小位置请修改 .speech-bubble 样式
        function showSpeechBubble(text, duration = 3000) {
            const bubble = document.getElementById('speech-bubble');
            bubble.textContent = text;
            bubble.classList.add('show');
            
            if (window.speechBubbleTimeout) {
                clearTimeout(window.speechBubbleTimeout);
            }
            
            window.speechBubbleTimeout = setTimeout(() => {
                bubble.classList.remove('show');
            }, duration);
        }

        // 运势文本数组
        const fortuneTexts = [
            '大吉, 十连双黄！今天的你被系统和幸运女神同时眷顾了！',
            '大吉, 玄学护体！明明一行代码都没改，Bug却奇迹般地自己消失了！',
            '大吉, 艾恩葛朗特万里无云，今天点外卖竟然被老板多送了一个鸡腿！',
            '中吉, 随机点开的新番意外地神仙，恭喜发现一部宝藏神作！',
            '中吉, 就像在看日常番一样，今天什么都不做，发呆也是一件正经事。',
            '中吉, 喜欢的角色今天存活确认，不仅没发便当，甚至还有高光时刻！',
            '中吉, 烙铁温度刚刚好，焊点圆润饱满，今天你是实验室里的‘焊武帝’。',
            '小吉, 进门刚好踩着上课铃，踩着点上课，今天的时间管理大师就是你。',
            '小吉, OpenCV 识别到了奇怪的人脸？别怕，大概率只是墙上的海报反光。',
            '小吉, 今天撸到的猫咪脾气特别好，甚至主动翻肚皮给你摸。',
            '平安, 平凡的日常，才是最连续的奇迹。今天不如早点洗洗睡吧。',
            '平安, 音乐播放器随机到了一首很久没听的动漫神曲，DNA 狠狠地动了！',
            '末吉, 今天没有拯救世界的任务，只要按时吃满三顿饭就算是巨大成功。',
            '末吉, 虽然天气很好，但在屋里拉上窗帘躺着，也是对周末的一种尊重。',
            '小凶, 前方高能预警！今天上网极易惨遭剧透，建议断网保平安。',
            '小凶, 墨菲定律生效中：当你想给别人演示功能时，它一定会报错死机。',
            '凶, Git 提交备注随手乱写，刚 push 完就发现没法回头修改。'
        ];

        // 播放随机音频 - type: 音频类型('interaction'或'fortune'), text: 要显示的气泡文本（可选）
        function playRandomAudio(type = 'interaction', text = null) {
            try {
                // 停止之前播放的音频
                if (window.currentAudio) {
                    window.currentAudio.pause();
                    window.currentAudio.currentTime = 0;
                    window.currentAudio = null;
                }
                
                const fs = require('fs');
                const path = require('path');
                
                const audioPath = path.resolve(__dirname, '..', 'resources', 'audio', type);
                console.log('音频路径:', audioPath);
                
                if (!fs.existsSync(audioPath)) {
                    console.error('音频目录不存在:', audioPath);
                    return null;
                }
                
                const files = fs.readdirSync(audioPath).filter(f => f.endsWith('.mp3'));
                console.log(`找到 ${files.length} 个音频文件 (${type}):`, files);
                
                if (files.length > 0) {
                    const randomFile = files[Math.floor(Math.random() * files.length)];
                    const filePath = path.join(audioPath, randomFile);
                    const audioUrl = 'file:///' + filePath.replace(/\\/g, '/');
                    
                    console.log('加载音频:', audioUrl);
                    const audio = new Audio(audioUrl);
                    audio.volume = 0.7;
                    
                    // 保存当前音频引用
                    window.currentAudio = audio;
                    
                    const fileName = randomFile.replace('.mp3', '').replace('[亚丝娜]', '').trim();
                    
                    // 决定要显示的文本
                    let displayText = text;
                    if (!displayText && type === 'fortune') {
                        // 运势文本映射
                        const sortedFiles = [...files].sort();
                        const fileIndex = sortedFiles.indexOf(randomFile);
                        if (fileIndex !== -1 && fileIndex < fortuneTexts.length) {
                            displayText = fortuneTexts[fileIndex];
                        } else {
                            displayText = fileName;
                        }
                    } else if (!displayText && type !== 'interaction') {
                        // 对于非交互类型（如其他未来类型），显示文件名
                        displayText = fileName;
                    }
                    
                    // 如果有要显示的文本，显示气泡并与音频同步
                    if (displayText) {
                        // 显示气泡，但不设置固定超时（将在音频结束时隐藏）
                        const bubble = document.getElementById('speech-bubble');
                        bubble.textContent = displayText;
                        bubble.classList.add('show');
                        
                        // 清除之前的超时
                        if (window.speechBubbleTimeout) {
                            clearTimeout(window.speechBubbleTimeout);
                            window.speechBubbleTimeout = null;
                        }
                        
                        // 在音频播放结束时隐藏气泡
                        audio.onended = function() {
                            if (window.currentAudio === audio) {
                                window.currentAudio = null;
                            }
                            bubble.classList.remove('show');
                            console.log('音频播放结束，隐藏气泡');
                        };
                        
                        // 设置一个安全超时，防止音频onended事件未触发（最长30秒）
                        window.speechBubbleTimeout = setTimeout(() => {
                            if (bubble.classList.contains('show')) {
                                bubble.classList.remove('show');
                                console.log('安全超时，隐藏气泡');
                            }
                        }, 30000);
                    } else {
                        // 没有文本显示，只设置音频结束清理
                        audio.onended = function() {
                            if (window.currentAudio === audio) {
                                window.currentAudio = null;
                            }
                        };
                    }
                    
                    audio.play().catch(e => console.log('音频播放失败:', e));
                    
                    console.log('播放音频:', randomFile);
                    return audio;
                } else {
                    console.log('未找到音频文件');
                    if (text) {
                        showSpeechBubble(text, 3000);
                    } else {
                        showSpeechBubble(type === 'fortune' ? fortuneTexts[Math.floor(Math.random() * fortuneTexts.length)] : '嗯？怎么了？', 3000);
                    }
                    return null;
                }
            } catch(e) {
                console.error('播放音频失败:', e);
                if (text) {
                    showSpeechBubble(text, 2000);
                } else {
                    showSpeechBubble('音频加载失败', 2000);
                }
                return null;
            }
        }
        
        // 根据动作文件名获取在空组中的索引
        function getMotionIndex(motionName) {
            // 空组动作列表，顺序与 model.json 中的 motions[""] 一致
            const motionList = [
                'I_FUN', 'I_FUN_S', 'I_FUN_W',
                'I_SAD', 'I_SAD_S', 'I_SAD_W',
                'I_SNEESE',
                'I_SURPRISE', 'I_SURPRISE_S', 'I_SURPRISE_W',
                'REPEAT_01', 'REPEAT_02', 'REPEAT_03',
                'I_ANGRY', 'I_ANGRY_S', 'I_ANGRY_W'
            ];
            // 如果传入的是带 .mtn 后缀的文件名，去掉后缀
            const cleanName = motionName.replace('.mtn', '');
            const index = motionList.indexOf(cleanName);
            console.log(`查找动作索引: ${motionName} -> ${cleanName}, 索引: ${index}`);
            return index;
        }
        
        // 与亚丝娜交互 - part: 身体部位('head','body','chest','foot')
        function interactWithAsuna(part = 'body') {
            console.log('与亚丝娜交互:', part);
            
            const responses = {
                head: ['嘿嘿，今天也要一起努力哦！', '稍微有点害羞呢……不过，并不讨厌啦。', '怎么啦？突然这样摸人家的头……', '有什么开心的事吗？笑得这么灿烂。', '既然你这么闲的话，要不要来帮我做三明治？', '今天天气真好呢，要一起去第 22 层的森林散步吗？', '辛苦啦！先把剑放下，喝杯热茶休息一下吧。', '结衣刚才还在找你呢，不去陪陪她吗？', '摸头可是会让人长不高的！……不过，下不为例哦。', '嗯……这种感觉，很让人安心呢。', '每次看到你平安回来，我就彻底放心了。', '好啦好啦，乖孩子乖孩子~（笑）'],
                body: ['真是的，好好工作啦，不要老是发呆！', '就算你这样一直戳我，我也不会马上给你做料理的啦！', '阿嚏！……难道是有人在说我坏话？', '别闹了啦，马上就要到楼层 Boss 的攻略会议时间了！', '哎呀，戳那里有点痒啦~', '肚子饿了吗？我包里还有之前用杂烩兔做好的特级炖肉哦。', '不要一直盯着我看啦，我的 HP 又没掉。', '今天你的状态不错嘛，有没有去野外好好练级？', '喂喂，身为攻略组的一员，可不要在这种地方偷懒啊！', '武器耐久度还好吗？回城的时候记得去莉兹的店里修理一下哦。', '如果累了的话，就在长椅上稍微睡一会儿吧，我帮你看着系统警报。'],
                chest: ['呀！你在摸哪里啊，变态！', '再乱碰的话，我可要拔剑了哦！闪烁之光可不是吃素的！', '唔……你这算是性骚扰哦，小心我吃掉你的属性点！', '你、你这家伙！快把手拿开啦！', '系统警告！这里可是圈内（安全区），不要做奇怪的动作！', '就算在 SAO 里没有痛觉，这种行为也是绝对禁止的！', '副团长的威严都要被你破坏了啦！给我去墙角反省一下！', '信不信我用八连击的『星屑飞溅』把你打飞出艾恩葛朗特？', '……你再这样，明天的早餐就只有发硬的黑面包了哦！'],
                foot: ['脚很敏感的', '不要碰脚啦', '痒死了', '不要挠我的脚底啦！', '脚腕被抓着好奇怪……']
            };
            
            const texts = responses[part] || ['嗯？', '怎么了？', '我在听呢'];
            const randomText = texts[Math.floor(Math.random() * texts.length)];
            
            console.log('显示气泡文本:', randomText, '部位:', part);
            console.log('调用playRandomAudio: interaction');
            playRandomAudio('interaction', randomText);
            
             if (window.live2DHelper) {
                 try {
                     console.log('Live2DHelper存在，开始触发动作');
                     // 根据不同部位触发不同的动作
                     let motionOptions = [];
                     switch(part) {
                         case 'head':
                             // 头部: 有趣、惊讶等动作
                             motionOptions = ['I_FUN', 'I_FUN_S', 'I_SURPRISE', 'I_SURPRISE_S'];
                             break;
                         case 'chest':
                             // 胸部: 生气、惊讶等动作
                             motionOptions = ['I_ANGRY', 'I_ANGRY_S', 'I_ANGRY_W', 'I_SURPRISE_W'];
                             break;
                         case 'body':
                             // 身体: 有趣、悲伤等动作
                             motionOptions = ['I_FUN', 'I_FUN_W', 'I_SAD', 'I_SAD_W'];
                             break;
                         case 'foot':
                             // 脚部: 打喷嚏、悲伤等动作
                             motionOptions = ['I_SNEESE', 'I_SAD', 'I_SAD_S', 'I_SURPRISE'];
                             break;
                         default:
                             motionOptions = ['I_FUN', 'I_SURPRISE', 'I_ANGRY'];
                     }
                     
                     // 随机选择一个动作
                     const randomMotion = motionOptions[Math.floor(Math.random() * motionOptions.length)];
                     console.log('触发动作:', randomMotion, '部位:', part);
                     
                     // 使用空组名和索引 (需要根据动作名找到索引)
                     const motionGroup = "";
                     const motionIndex = getMotionIndex(randomMotion);
                     console.log('动作组:', motionGroup, '索引:', motionIndex);
                     
                     if (motionIndex !== -1) {
                         window.live2DHelper.startMotion(motionGroup, motionIndex.toString());
                         console.log('已调用startMotion with group and index');
                     } else {
                         // 如果索引未找到，使用随机索引 (0-15)
                         const fallbackIndex = Math.floor(Math.random() * 16);
                         console.log('动作索引未找到，使用随机索引:', fallbackIndex);
                         window.live2DHelper.startMotion(motionGroup, fallbackIndex.toString());
                     }
                 } catch(e) {
                     console.log('Live2D动作失败:', e);
                 }
             }
        }
        
        // 设置亚丝娜交互 - 点击画布不同部位触发不同反应
        function setupAsunaInteraction() {
            const canvas = document.getElementById('glcanvas');
            
            canvas.addEventListener('click', (e) => {
                console.log('Canvas点击事件触发');
                // 检查是否是拖拽后的点击（拖拽后100毫秒内的点击忽略）
                const now = Date.now();
                if (now - window.lastDragEndTime < 100) {
                    console.log('忽略拖拽后的点击，时间差:', now - window.lastDragEndTime, 'ms');
                    return;
                }
                
                // 检查右键菜单是否显示
                const contextMenu = document.getElementById('context-menu');
                if (contextMenu.style.display === 'block') {
                    // 如果菜单显示，点击画布则隐藏菜单
                    hideContextMenu();
                    return;
                }
                
                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                console.log('Canvas点击位置:', x, y, '画布尺寸:', canvas.width, canvas.height);
                
                let part = 'body';
                if (y < 250) part = 'head';
                else if (y < 500) part = 'chest';
                else if (y < 900) part = 'body';
                else part = 'foot';
                
                interactWithAsuna(part);
            });
            
            console.log('亚丝娜交互已设置');
        }
        
        // 初始化高级功能 - 延迟设置交互和显示欢迎气泡
        function initAdvancedFeatures() {
            setTimeout(() => {
                setupAsunaInteraction();
                showSpeechBubble('亚丝娜上线啦~', 2000);
            }, 1000);
        }
        
        window.interactWithAsuna = interactWithAsuna;
        window.showSpeechBubble = showSpeechBubble;
        window.playRandomAudio = playRandomAudio;
        
        // 监听AI回复显示事件
        ipcRenderer.on('show-ai-reply', (event, reply) => {
            console.log('收到AI回复，显示在气泡中:', reply.substring(0, 50) + '...');
            showSpeechBubble(reply, 5000);
        });
        
        // 监听AI历史记录返回事件
        ipcRenderer.on('return-ai-history', (event, history) => {
            console.log('收到AI历史记录:', history.length, '条记录');
            displayAIHistory(history);
        });