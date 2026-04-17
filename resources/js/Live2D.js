var live2DHelper;
// Live2D模型控制文件 - 负责加载Live2D模型和鼠标跟随
/**
 * InitLive2D
 * @param {String} modelName 
 */
// 初始化Live2D模型 - 根据模型名称加载对应模型
function initLive2D(modelName) {
	if ($("#glcanvas").length == 0) {
		return;
	}
	loadModel(modelName);
}
/**
 * loadModel
 * @param {String} modelName 
 */
// 加载Live2D模型 - 创建Live2DHelper实例并加载模型文件
function loadModel(modelName) {
	live2DHelper = new Live2DHelper({ canvas: 'glcanvas' });
	window.live2DHelper = live2DHelper;
	
	try {
		var canvas = document.getElementById('glcanvas');
		canvas.style.imageRendering = 'optimizeSpeed';
		canvas.style.webkitImageSmoothingEnabled = false;
		canvas.style.mozImageSmoothingEnabled = false;
		canvas.style.imageSmoothingEnabled = false;
	} catch(e) {
		console.log('Canvas样式优化失败:', e);
	}
	
	try {
		var canvas = document.getElementById('glcanvas');
		var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
		if (gl) {
			gl.disable(gl.DITHER);
			gl.disable(gl.STENCIL_TEST);
			console.log('WebGL性能优化已应用');
		}
	} catch(e) {
		console.log('WebGL优化失败:', e);
	}
	
	console.info("Model : " + modelName);
  var path = window.__resourceRoot ? 
    window.__resourceRoot + `/models/asuna_${modelName}/asuna_${modelName}.model.json` :
    `../resources/models/asuna_${modelName}/asuna_${modelName}.model.json`;
	console.log('加载模型路径:', path, '资源根:', window.__resourceRoot);
	live2DHelper.loadModel(path, function () {
		console.log('模型加载成功回调');
		console.log('画布可见性:', $('#glcanvas').is(':visible'));
		console.log('画布尺寸:', $('#glcanvas').width(), 'x', $('#glcanvas').height());
		console.log('画布位置:', $('#glcanvas').offset());
		console.log('live2DHelper实例:', live2DHelper);
		try {
			var gl = document.getElementById('glcanvas').getContext('webgl') || document.getElementById('glcanvas').getContext('experimental-webgl');
			console.log('WebGL上下文:', gl ? '成功' : '失败');
			if (gl) {
				console.log('WebGL渲染器:', gl.getParameter(gl.RENDERER));
				console.log('WebGL版本:', gl.getParameter(gl.VERSION));
			}
		} catch(e) {
			console.error('WebGL错误:', e);
		}
		
 		console.log('即将调用 startMotion("", "0") 播放初始动作');
 		live2DHelper.startMotion("", "0");
 		console.log('startMotion 调用完成');
 		live2DHelper.startTurnHead();
 		followMouse();

		if (!$("#glcanvas").hasClass("animated")) {
			$("#glcanvas").addClass("animated fadeIn");
		}
	});
}

// 鼠标跟随功能 - 实现模型视线跟随鼠标移动
function followMouse() {
	// head follow mouse
	console.log('初始化鼠标跟随...');
	var isMouseDown = false;
	var canvas = document.getElementById('glcanvas');
	
	$(canvas).mousedown(function (e) {
		isMouseDown = true;
		console.log('Canvas mousedown at:', e.clientX, e.clientY);
	})
		.mouseup(function (e) {
			isMouseDown = false;
			console.log('Canvas mouseup');
		})
 		.mouseout(function (e) {
 			isMouseDown = false;
 			console.log('Canvas mouseout - 鼠标离开画布，但全屏视线跟随继续');
 			// 不再重置视线，因为全屏鼠标跟随
 			// if (live2DHelper != null) {
 			// 	live2DHelper.viewPointer(0, 0);
 			// }
 		});
	
	// 全局鼠标跟踪变量
	var lastMouseX = 0;
	var lastMouseY = 0;
	var lastUpdateTime = 0;
	var mouseInWindow = false;
	var ipcRenderer = null;
	
	// 尝试获取ipcRenderer
	try {
		ipcRenderer = require('electron').ipcRenderer;
		console.log('成功获取ipcRenderer');
	} catch (err) {
		console.log('无法获取ipcRenderer，将使用窗口内鼠标跟踪:', err.message);
	}
	
	// 更新视线方向的函数
	function updateGaze(clientX, clientY, source) {
		if (live2DHelper == null) {
			console.log('live2DHelper为null，跳过视线更新');
			return;
		}
		
		var canvas = document.getElementById('glcanvas');
		if (!canvas) {
			console.log('Canvas元素未找到，跳过视线更新');
			return;
		}
		
		var rect = canvas.getBoundingClientRect();
		
		// 检查鼠标是否在画布内
		var isMouseInCanvas = 
			clientX >= rect.left && clientX <= rect.right &&
			clientY >= rect.top && clientY <= rect.bottom;
		
		// 创建模拟事件对象，使followPointer能正确获取画布边界
		var simulatedEvent = {
			clientX: clientX,
			clientY: clientY,
			target: canvas
		};
		
		// 始终跟随鼠标，全屏幕范围
		live2DHelper.followPointer(simulatedEvent);
		
			// 增强视线跟随：基于全屏鼠标位置控制头部转动
			var canvasCenterX = rect.left + rect.width / 2;
			var canvasCenterY = rect.top + rect.height / 2;
			
			// 计算鼠标相对于画布中心的偏移
			var dx = clientX - canvasCenterX;
			var dy = clientY - canvasCenterY;
			
			// 动态计算最大偏移量，基于屏幕尺寸 - 大幅提高灵敏度
			var maxOffset = Math.max(window.innerWidth, window.innerHeight) * 0.2; // 从0.3改为0.2，大幅增加灵敏度
			maxOffset = Math.max(100, maxOffset); // 最小100像素，大幅增加灵敏度
			
			// 计算原始偏移比例（不限制）
			var rawNormX = dx / maxOffset;
			var rawNormY = -dy / maxOffset; // 反转Y轴
			
			// 应用非线性响应曲线：偏移越大，响应越强
			var enhancedX = Math.sign(rawNormX) * Math.min(1, Math.abs(rawNormX) * 2.0); // 增强2.0倍，大幅提高响应
			var enhancedY = Math.sign(rawNormY) * Math.min(1, Math.abs(rawNormY) * 2.0);
			
			// 最终归一化到[-1.5, 1.5]范围，提供更极端的视线角度
			var normX = Math.max(-1.5, Math.min(1.5, enhancedX));
			var normY = Math.max(-1.5, Math.min(1.5, enhancedY));
			
			// 调用viewPointer控制视线方向 - 增强视线跟随
			live2DHelper.viewPointer(normX, normY);
			// 限制日志输出
			var shouldLog = false;
			if (source === 'window-mousemove') {
				// 窗口内鼠标移动：每秒最多记录5次
				if (!window.lastMouseMoveLog) window.lastMouseMoveLog = 0;
				var now = Date.now();
				if (now - window.lastMouseMoveLog > 200) { // 每200毫秒最多一次
					shouldLog = true;
					window.lastMouseMoveLog = now;
				}
			} else if (source === 'global-poll') {
				// 全局轮询：每10次记录一次
				if (!window.globalPollLogCounter) window.globalPollLogCounter = 0;
				window.globalPollLogCounter++;
				if (window.globalPollLogCounter % 10 === 1) {
					shouldLog = true;
				}
			}
			if (shouldLog) {
				console.log('全屏幕鼠标跟随[' + source + ']: 鼠标(' + clientX.toFixed(0) + ', ' + clientY.toFixed(0) + 
					') 画布内: ' + (isMouseInCanvas ? '是' : '否') + 
					') 视线方向: ' + normX.toFixed(2) + ', ' + normY.toFixed(2));
			}
		
		// 更新最后已知鼠标位置和视线方向
		window.lastMouseX = clientX;
		window.lastMouseY = clientY;
		window.lastViewX = normX;
		window.lastViewY = normY;
		window.mouseUpdateTime = Date.now();
	}
	
	// 窗口内鼠标移动事件（高频更新）
	$(window).mousemove(function (e) {
		lastMouseX = e.clientX;
		lastMouseY = e.clientY;
		lastUpdateTime = Date.now();
		if (!mouseInWindow) {
			console.log('鼠标进入浏览器窗口，切换为窗口内跟踪');
		}
		mouseInWindow = true;
		updateGaze(e.clientX, e.clientY, 'window-mousemove');
	});
	
	// 鼠标离开窗口检测
	$(window).mouseleave(function (e) {
		mouseInWindow = false;
		console.log('鼠标离开浏览器窗口，启用全局跟踪');
	});
	
	// 全局鼠标位置轮询（使用Electron主进程获取屏幕坐标）
	function pollGlobalMouse() {
		if (!mouseInWindow && ipcRenderer && live2DHelper != null) {
			// 鼠标在窗口外，请求全局位置
			ipcRenderer.send('get-global-mouse-position');
		}
	}
	
	// 监听全局鼠标位置响应
	if (ipcRenderer) {
		ipcRenderer.on('global-mouse-position', (event, data) => {
			if (!mouseInWindow && live2DHelper != null) {
				// 将屏幕坐标转换为窗口客户端坐标
				var clientX = data.screenX - data.windowX;
				var clientY = data.screenY - data.windowY;
				
				// 调试信息：每10次记录一次数据
				if (!window.globalPollCounter) window.globalPollCounter = 0;
				window.globalPollCounter++;
				if (window.globalPollCounter % 10 === 1) {
					console.log('全局鼠标数据:', JSON.stringify(data), '转换后坐标:', clientX.toFixed(0), clientY.toFixed(0));
				}
				
				// 检查坐标是否在窗口内（包括负值和超出窗口范围）
				// 即使鼠标在窗口外，我们仍然更新视线
				updateGaze(clientX, clientY, 'global-poll');
			}
		});
		
		// 启动全局轮询，每100毫秒一次（10fps）
		setInterval(pollGlobalMouse, 100);
		console.log('全局鼠标轮询已启动（每100毫秒）');
	}
	
	console.log('鼠标跟随初始化完成');
}

/**
 * --------------------------------------------------
 *                       tool
 * --------------------------------------------------
 */

/**
 * return a random number
 * @param  {int} min number
 * @param  {int} max number
 * @return {int} random number
 */
// 生成随机数 - 返回[min, max]范围内的随机整数
function getRandomNum(min, max) {
	var range = max - min;
	return (min + Math.round(Math.random() * range));
}

/**
 * return a random array
 * @param  {int} min number
 * @param  {int} max number
 * @return {Array} shuffle array
 */
// 生成随机数组 - 返回[min, max]范围内数字的随机排列
function getRandomArr(min, max) {
	var arr = [];
	for (var i = 0; i <= max - min; i++) {
		arr[i] = min + i;
	}
	// arr.sort(function(){
	//   return 0.5-Math.random();
	// });
	shuffle(arr);
	return arr;
}

/**
 * shuffle
 * @param  {Array} 
 * @return {Array} 
 */
// 洗牌算法 - 随机打乱数组顺序
function shuffle(arr) {
	var length = arr.length,
		temp,
		random;
	while (0 != length) {
		random = Math.floor(Math.random() * length)
		length--;
		// swap
		temp = arr[length];
		arr[length] = arr[random];
		arr[random] = temp;
	}
	return arr;
}
