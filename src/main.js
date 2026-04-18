const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage, screen } = require('electron');
const path = require('path');

// Electron主进程文件 - 控制应用窗口和系统托盘
// 如需调整亚丝娜大小，请修改 createWindow 中的 width 和 height 参数
// 如需调整窗口位置，请修改 x 和 y 参数

app.commandLine.appendSwitch('high-dpi-support', '1');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('enable-transparent-visuals');

process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
});

console.log('Electron主进程启动...');

let mainWindow = null;
let aiWindow = null;
let tray = null;

// 创建主窗口函数
// 参数说明:
// width: 窗口宽度 (调整亚丝娜大小需同时修改此处和index.html中canvas的width)
// height: 窗口高度 (调整亚丝娜大小需同时修改此处和index.html中canvas的height)
// x: 窗口初始X坐标
// y: 窗口初始Y坐标
// 其他参数: frame (无边框), transparent (透明), alwaysOnTop (置顶) 等
function createWindow() {
  console.log('创建窗口...');
  mainWindow = new BrowserWindow({
    width: 500,
    height: 1000,
    x: 100,
    y: 100,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: false,
    resizable: false,
    movable: true,
    hasShadow: false,
    backgroundColor: '#00000000',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false,
      allowRunningInsecureContent: true,
      allowFileAccessFromFileURLs: true,
      allowUniversalAccessFromFileURLs: true,
      backgroundThrottling: false,
      disableBlinkFeatures: 'VSync'
    }
  });
  
  mainWindow.setPosition(100, 100);

  mainWindow.loadFile('src/index.html')
    .then(() => {
      console.log('窗口加载成功');
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
        console.log(`渲染进程: ${message} (${sourceId}:${line})`);
      });
    })
    .catch((err) => {
      console.error('加载窗口失败:', err);
    });

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  setupTray();
  setupWindowDrag();
}

// 创建AI对话窗口
function createAIWindow() {
  console.log('创建AI窗口...');
  
  if (aiWindow && !aiWindow.isDestroyed()) {
    aiWindow.show();
    aiWindow.focus();
    return;
  }
  
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  
  aiWindow = new BrowserWindow({
    width: 700,
    height: 250,
    x: width - 1020,
    y: height - 320,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: false,
    resizable: false,
    movable: true, // 允许窗口拖动
    hasShadow: true,
    backgroundColor: '#00000000',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false,
      allowRunningInsecureContent: true,
      allowFileAccessFromFileURLs: true,
      allowUniversalAccessFromFileURLs: true,
      backgroundThrottling: false,
      disableBlinkFeatures: 'VSync'
    }
  });
  
  aiWindow.loadFile('src/ai-window.html')
    .then(() => {
      console.log('AI窗口加载成功');
      aiWindow.show();
      aiWindow.focus();
    })
    .catch((err) => {
      console.error('加载AI窗口失败:', err);
    });
  
  // 开发工具
  if (process.argv.includes('--dev')) {
    aiWindow.webContents.openDevTools({ mode: 'detach' });
  }
  
  aiWindow.on('closed', () => {
    aiWindow = null;
    console.log('AI窗口已关闭');
  });
}

// 设置系统托盘图标和菜单
function setupTray() {
  const iconPath = path.join(__dirname, '..', 'resources', 'images', 'tray-icon.png');
  let trayIcon;
  
  try {
    trayIcon = nativeImage.createFromPath(iconPath);
  } catch (err) {
    trayIcon = nativeImage.createEmpty();
  }
  
  tray = new Tray(trayIcon);
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示/隐藏',
      click: () => {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
        }
      }
    },
    {
      label: '切换服装',
      submenu: [
        { label: '服装 01', type: 'radio', checked: false },
        { label: '服装 02', type: 'radio', checked: true },
        { label: '服装 03', type: 'radio', checked: false }
      ]
    },
    {
      label: '音量',
      submenu: [
        { label: '静音', type: 'radio', checked: false },
        { label: '低', type: 'radio', checked: false },
        { label: '中', type: 'radio', checked: true },
        { label: '高', type: 'radio', checked: false }
      ]
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.quit();
      }
    }
  ]);
  
  tray.setToolTip('Asuna 桌面宠物');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });
}

// 设置窗口拖拽功能 - 通过IPC监听拖拽事件
function setupWindowDrag() {
  ipcMain.on('window-drag', (event, { x, y }) => {
    if (mainWindow) {
      const [currentX, currentY] = mainWindow.getPosition();
      mainWindow.setPosition(currentX + x, currentY + y);
    }
  });
}

app.whenReady().then(() => {
  console.log('Electron应用准备就绪');
  createWindow();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 监听关闭窗口事件
ipcMain.on('close-window', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

// 监听最小化窗口事件
ipcMain.on('minimize-window', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

// 监听切换窗口置顶事件
ipcMain.on('toggle-always-on-top', () => {
  if (mainWindow) {
    const isAlwaysOnTop = mainWindow.isAlwaysOnTop();
    mainWindow.setAlwaysOnTop(!isAlwaysOnTop);
  }
});

// 监听获取全局鼠标位置请求
ipcMain.on('get-global-mouse-position', (event) => {
  if (mainWindow) {
    const cursorPoint = screen.getCursorScreenPoint();
    const windowBounds = mainWindow.getBounds();
    event.reply('global-mouse-position', {
      screenX: cursorPoint.x,
      screenY: cursorPoint.y,
      windowX: windowBounds.x,
      windowY: windowBounds.y,
      windowWidth: windowBounds.width,
      windowHeight: windowBounds.height
    });
  } else {
    event.reply('global-mouse-position', {
      screenX: 0,
      screenY: 0,
      windowX: 0,
      windowY: 0,
      windowWidth: 0,
      windowHeight: 0
    });
  }
});

// 监听打开AI窗口事件
ipcMain.on('open-ai-window', () => {
  console.log('收到打开AI窗口请求');
  createAIWindow();
});

// 监听AI窗口拖拽事件
ipcMain.on('ai-window-drag', (event, { x, y }) => {
  if (aiWindow && !aiWindow.isDestroyed()) {
    const [currentX, currentY] = aiWindow.getPosition();
    aiWindow.setPosition(currentX + x, currentY + y);
  }
});

// 监听清空AI历史事件（从主窗口发送）
ipcMain.on('clear-ai-history', () => {
  console.log('收到清空AI历史请求');
  if (aiWindow && !aiWindow.isDestroyed()) {
    aiWindow.webContents.send('clear-ai-history');
  }
});

// 监听切换AI模型事件（从主窗口发送）
ipcMain.on('switch-ai-model', () => {
  console.log('收到切换AI模型请求');
  if (aiWindow && !aiWindow.isDestroyed()) {
    aiWindow.webContents.send('switch-ai-model');
  }
});

// 监听显示AI回复事件（从AI窗口发送）
ipcMain.on('show-ai-reply', (event, reply) => {
  console.log('收到AI回复，转发到主窗口:', reply.substring(0, 50) + '...');
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('show-ai-reply', reply);
  }
});

// 监听获取AI历史记录请求（从主窗口发送）
ipcMain.on('get-ai-history', (event) => {
  console.log('收到获取AI历史记录请求');
  if (aiWindow && !aiWindow.isDestroyed()) {
    aiWindow.webContents.send('get-ai-history');
  } else {
    // AI窗口不存在，返回空历史记录
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('return-ai-history', []);
    }
  }
});

// 监听返回AI历史记录（从AI窗口发送）
ipcMain.on('return-ai-history', (event, history) => {
  console.log('收到AI历史记录，转发到主窗口:', history.length, '条记录');
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('return-ai-history', history);
  }
});