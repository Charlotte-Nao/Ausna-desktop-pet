var live2DHelper;
/**
 * InitLive2D
 * @param {String} modelName 
 */
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
		
		live2DHelper.startMotion("", "0");
		live2DHelper.startTurnHead();
		followMouse();

		if (!$("#glcanvas").hasClass("animated")) {
			$("#glcanvas").addClass("animated fadeIn");
		}
	});
}

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
			console.log('Canvas mouseout');
			// 不再重置视线，因为全屏鼠标跟随
			// if (live2DHelper != null) {
			// 	live2DHelper.viewPointer(0, 0);
			// }
		});
	
	// 使用document而不是canvas，全屏幕鼠标跟随
	$(document).mousemove(function (e) {
		if (live2DHelper != null) {
			var canvas = document.getElementById('glcanvas');
			var rect = canvas.getBoundingClientRect();
			
			// 创建模拟事件对象，使followPointer能正确获取画布边界
			var simulatedEvent = {
				clientX: e.clientX,
				clientY: e.clientY,
				target: canvas
			};
			
			// 始终跟随鼠标，全屏幕范围
			live2DHelper.followPointer(simulatedEvent);
			
			// 增强视线跟随：基于全屏鼠标位置控制头部转动
			var canvasCenterX = rect.left + rect.width / 2;
			var canvasCenterY = rect.top + rect.height / 2;
			
			// 计算鼠标相对于画布中心的偏移
			var dx = e.clientX - canvasCenterX;
			var dy = e.clientY - canvasCenterY;
			
			// 动态计算最大偏移量，基于屏幕尺寸
			var maxOffset = Math.max(window.innerWidth, window.innerHeight) * 0.5;
			maxOffset = Math.max(300, maxOffset); // 最小300像素
			
			// 归一化偏移，限制最大偏移量
			// 注意：Y轴需要反转，因为屏幕坐标系Y向下为正，模型坐标系Y向上为正
			var normX = Math.max(-1, Math.min(1, dx / maxOffset));
			var normY = Math.max(-1, Math.min(1, -dy / maxOffset)); // 反转Y轴
			
			// 调用viewPointer控制视线方向
			live2DHelper.viewPointer(normX, normY);
			
			console.log('全屏幕鼠标跟随:', e.clientX, e.clientY, '视线方向:', normX.toFixed(2), normY.toFixed(2), 'maxOffset:', maxOffset.toFixed(0));
		}
	});
	
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
