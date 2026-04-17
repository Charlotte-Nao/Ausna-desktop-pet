const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage } = require('electron');
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