function miku_img_album_touch(cfg){
		var miku_index = 0;
		var g_main = document.querySelector('#miku_img_album_main_' + cfg.pid);
		var g_bigImg = g_main.querySelector('#miku_img_album_big_img_' + cfg.pid);
		var g_imgList = g_bigImg.querySelectorAll('li');
		var g_prev = g_main.querySelector('.prev');
		var g_next = g_main.querySelector('.next');
		var g_curIndex = document.querySelector('#miku_img_album_cur_index_' + cfg.pid);
		var g_mask = document.querySelector('#miku_img_album_mask_'+ cfg.pid);
		var g_mask_close = g_mask.querySelector('.close');
		var g_mask_zoom = g_mask.querySelector('.zoom');
		var g_mask_zoom_icon = g_mask.querySelector('.zoom i');
		var g_mask_loading =  g_mask.querySelector('.loadding');
		var g_mask_tips = g_mask.querySelector('.tips');
		var g_mask_tipsContent = g_mask.querySelector('.tips .tips-content');
		var g_mask_img_block = g_mask.querySelector('.img-block');
		var g_mask_img = g_mask.querySelector('img');
		var g_mask_img_status = g_mask.querySelector('.img-status');
		var g_imgSize = {};
		//高度百分比
		cfg.heightPercent = cfg.heightPercent/100;

		//用户滑动的时间(毫秒）、距离
		cfg.startTime = 0;
		cfg.startX = 0;
		cfg.startY = 0;
		cfg.offsetX = 0;
		cfg.offsetY = 0;

		cfg.scrollTop = 0;
		cfg.zoom = 1;
		cfg.click = 0;

		//iscroll页面滚动
		cfg.scroll_mask = new IScroll("#miku_img_album_mask_"+ cfg.pid, {
			scrollX:true,
			scrollY:true,
			click:true
		});
		cfg.scroll_tips = new IScroll('#miku_img_album_tips_'+ cfg.pid,{
			scrollX:false,
			scrollY:true
		})

		window.addEventListener('orientationchange', function(evt){
			setTimeout(function(){
				init();
			},800);
		});
		
		init();

		function init(){
			//浏览器视口的宽高
			cfg.viewWidth = window.innerWidth;
			cfg.viewHeight = window.innerHeight;

			//帖子内容区域的最大宽度、允许的图册最大高度。
			cfg.maxWidth = g_main.offsetWidth;
			var maxHeight = cfg.viewHeight * cfg.heightPercent;
			if(cfg.maxWidth > cfg.viewHeight){
				//横屏
				cfg.maxHeight = (cfg.maxWidth * 0.65) > maxHeight ? maxHeight : (cfg.maxWidth * 0.65);
			}else{
				//竖屏
				cfg.maxHeight = (cfg.maxWidth * 1.5) > maxHeight ? maxHeight : (cfg.maxWidth * 1.5);
			}
			//最小高度判断
			if(cfg.maxHeight < cfg.minHeight){
				cfg.maxHeight = cfg.minHeight;
			}

			cfg.validWidth = cfg.maxWidth/6;
			

			//处理图片列表区域
			for (var i = 0; i < g_imgList.length; i++) {
				g_imgList[i].style.webkitTransform = "translate3d("+cfg.maxWidth*(i - miku_index) +"px,0,0)";
				g_imgList[i].ontouchstart = touchStart;
				g_imgList[i].ontouchmove = touchMove;
				g_imgList[i].ontouchend= touchEnd;
				if(cfg.showStyle == 2){
					// 固定高度
					g_imgList[i].style.height =  cfg.maxHeight + 'px';
				}
				var imgDom = g_imgList[i].querySelector('img');
				if(imgDom){
					imgDom.style.display = 'none';
					imgDom.miku_index = i;
					setImgSize(imgDom);
					imgDom.onclick = showBigImg;
					imgDom.onerror = function(){
						this.src="source/plugin/img_album/img/nopic.gif";
						this.parentNode.querySelector('.loadding').style.display = 'none';
						this.style.display = 'inline-block';
					}
					imgDom.onload = function(){
						this.parentNode.querySelector('.loadding').style.display = 'none';
						this.style.display = 'inline-block';
					}
				}

			}

			//设置图册的宽高
			if(cfg.showStyle == 1){
				// 高度自适应
				g_main.style.minHeight = '220px';
			}else if(cfg.showStyle == 2){
				// 固定高度
				g_main.style.height = cfg.maxHeight + 'px';
				g_bigImg.style.height = cfg.maxHeight + 'px';
			}

			//屏幕尺寸改变时，重新设置遮罩层
			if(g_mask.style.display !='none'){
				loadImg(g_mask_img, function(obj, img, ok){
					zoomOut(obj, img, ok);
					g_mask_loading.style.display = 'none';
			    	g_mask_img.style.display = 'inline-block';
				});
			}
			

			//单纯为了阻止“在向右滑动时”，浏览器的“后退一步”操作。
			g_mask.ontouchstart = function(evt){
				cfg.startX = evt.touches[0].pageX;
				cfg.startY = evt.touches[0].pageY;

			}
			g_mask.ontouchmove = function(evt){
				var scrollLeft = g_mask.scrollLeft || 0;
				cfg.offsetX = evt.touches[0].pageX - cfg.startX;
				cfg.offsetY = evt.touches[0].pageY - cfg.startY;
				evt.preventDefault();
			}

			//双击缩放图片
			g_mask_img.onclick = function(evt){
				cfg.click++;
				if(cfg.click > 2){
					cfg.click = 0;
				}else if(cfg.click == 2){
					zoom();
				}else{
					setTimeout(function(){
						cfg.click = 0;
					}, 500);
				}
				evt.preventDefault();
			}

			g_mask_img.onerror = function(){
				g_mask_img.src="source/plugin/img_album/img/nopic.gif";
				g_mask_loading.style.display = 'none';
				g_mask_img.style.display = 'inline-block';
			}

			g_prev.onclick = prev;
			g_next.onclick = next;
			g_mask_zoom.ontouchend = zoom;
			g_mask_close.ontouchend = hideBigImg;
		}


		function setTips(){
			var srcDom = g_imgList[miku_index].querySelector('.tips p');
			g_mask_tipsContent.innerHTML = srcDom.innerHTML;
		}

		function hideTips(){
			g_mask_tips.style.display = "none";
			cfg.scroll_tips.refresh();
		}

		function showTips(){
			if(g_mask_tipsContent.innerHTML != ''){
				g_mask_tips.style.display = "block";
				cfg.scroll_tips.refresh();
			}
		}

		function zoom(evt){
			if(cfg.zoom == 1){
				// 放大操作
				loadImg(g_mask_img, zoomIn);
			}else{
				loadImg(g_mask_img, zoomOut);
			}

		}

		function zoomIn(obj, img, ok){
			// 放大
			if(ok){
				var width = img['width'];
				var height = img['height'];
				g_mask_img.style.height = height + 'px';
				g_mask_img.style.width = width + 'px';
				g_mask_img_status.innerHTML = '<span>100%</span>';
				g_mask_img_status.style.display = 'inline-block';
				clearTimeout(g_mask_img_status.timer);
				g_mask_img_status.timer = setTimeout(function(){
					g_mask_img_status.style.display = 'none';
				},2000);

			}else{
				g_mask_img.style.height='auto';
				g_mask_img.style.width='auto';
			}
			// g_mask_img.style.maxHeight='none';
			// g_mask_img.style.maxWidth='none';
			g_mask_img.className = 'maxsize-none';
			g_mask_zoom.style.color = '#25c6fc';
			g_mask_zoom_icon.className = 'iconfont icon-icon--1';
			var y = g_mask.scrollHeight/6;
			var x = g_mask.scrollWidth/6;
			g_mask.scrollLeft = x;
			g_mask.scrollTop = y;
			cfg.zoom = 0;
			hideTips();

			//iScroll页面滚动
			cfg.scroll_mask.scrollTo(-x,-y);
			cfg.scroll_mask.refresh();
		}

		function zoomOut(obj, img, ok){
			// 缩小
			if(ok){
				var width = img['width'];
				var height = img['height'];
				
				if(width < cfg.viewWidth){
					// 图片比容器窄
					var zw = width;
					var zh = height;
				}else {
					// 图比容器宽
					var zw = cfg.viewWidth;
					var zh = parseInt(zw/width*height);
				}

				if(zh > cfg.viewHeight){
					// 图比容器高
					var bili = cfg.viewHeight / height;
					zh = cfg.viewHeight;
					zw = parseInt(width*bili);
				}
				
				g_mask_img.style.height = zh + 'px';
				g_mask_img.style.width = zw + 'px';
				g_mask_img_status.innerHTML = '<span>' + parseInt(zw/width*100)+ '%</span>';
				g_mask_img_status.style.display = 'inline-block';
				clearTimeout(g_mask_img_status.timer);
				g_mask_img_status.timer = setTimeout(function(){
					g_mask_img_status.style.display = 'none';
				},2000);

			}else{
				g_mask_img.style.height = null;
				g_mask_img.style.width = null;
			}
			
			cfg.zoom = 1;
			g_mask_img.style.maxHeight = 'none';
			g_mask_img.style.maxWidth = 'none';
			g_mask_zoom.style.color = '#77c34f';
			g_mask_zoom_icon.className = 'iconfont icon-icon--';
			g_mask_img_block.style.webkitTransform = "translate3d(0,0,0)";
			showTips();

			//iScroll页面滚动
			cfg.scroll_mask.refresh();
		}


		// 点击图片显示大图“遮罩层”
		function showBigImg(){
			setTips();
		    g_mask_img.style.display = 'none';
			g_mask_loading.style.display = 'inline-block';
			g_mask.style.display='-webkit-box';
			var path = this.getAttribute('miku-origimg-src');
			g_mask_img.src = path;
			loadImg(g_mask_img, function(obj, img, ok){
				zoomOut(obj, img, ok);
				g_mask_loading.style.display = 'none';
		    	g_mask_img.style.display = 'inline-block';
			})

			g_mask_img.onload = function(){
				g_mask_loading.style.display = 'none';
		    	g_mask_img.style.display = 'inline-block';
			}
			g_mask_close.style.color=null;
		}

		// 关闭大图“遮罩层”
		function hideBigImg(){
			this.style.color = '#5d150f';
			
		    setTimeout(function(){
		    	g_mask.style.display='none';
		    	g_mask_img.style.display = 'none';
				g_mask_img.style.height='';
				g_mask_img.style.width='';
				// g_mask_img.style.maxHeight='100%';
				// g_mask_img.style.maxWidth='100%';
				g_mask_img.className = 'maxsize-100';
				g_mask_zoom.style.color = '#77c34f';
				g_mask_zoom_icon.className = 'iconfont icon-icon--';
				cfg.zoom = 1;
				zoomOut();
		    }, 350);
		}

		function prev(){
			cfg.maxWidth = g_main.offsetWidth;
			if(miku_index-1 < 0){
				miku_index = 0;
				var self = 0;
				var front = 0;
				var behind = cfg.maxWidth + 'px';
			}else{
				miku_index--;
				var self = 0;
				var front = -cfg.maxWidth + 'px';
				var behind = cfg.maxWidth + 'px';
			}

			heightAutoResponse(g_imgList[miku_index]);
			g_imgList[miku_index].style.webkitTransform = "translate3d("+ self +",0,0)";
			g_imgList[miku_index-1] && (g_imgList[miku_index-1].style.webkitTransform = "translate3d("+ front +",0,0)");
			g_imgList[miku_index+1] && (g_imgList[miku_index+1].style.webkitTransform = "translate3d("+ behind +",0,0)");

			g_curIndex.innerHTML = miku_index + 1;
		}
		function next(){
			cfg.maxWidth = g_main.offsetWidth;
			if(miku_index+1 >= cfg.imgNum){
				miku_index = cfg.imgNum - 1;
				var self = 0;
				var front = -cfg.maxWidth + 'px';
				var behind = cfg.maxWidth + 'px';
			}else{
				miku_index++;
				var self = 0;
				var front = -cfg.maxWidth + 'px';
				var behind = cfg.maxWidth + 'px';
			}
			heightAutoResponse(g_imgList[miku_index]);
			g_imgList[miku_index].style.webkitTransform = "translate3d("+ self +",0,0)";
			g_imgList[miku_index-1] && (g_imgList[miku_index-1].style.webkitTransform = "translate3d("+ front +",0,0)");
			g_imgList[miku_index+1] && (g_imgList[miku_index+1].style.webkitTransform = "translate3d("+ behind +",0,0)");

			g_curIndex.innerHTML = miku_index + 1;
			lazyloadImages();
		}

		function restore(){
			cfg.maxWidth = g_main.offsetWidth;
			var self = 0;
			var front = -cfg.maxWidth + 'px';
			var behind = cfg.maxWidth + 'px';
			g_imgList[miku_index].style.webkitTransform = "translate3d("+ self +",0,0)";
			g_imgList[miku_index-1] && (g_imgList[miku_index-1].style.webkitTransform = "translate3d("+ front +",0,0)");
			g_imgList[miku_index+1] && (g_imgList[miku_index+1].style.webkitTransform = "translate3d("+ behind +",0,0)");
		}



		function touchStart(evt){
			cfg.startTime = Date.now();
			cfg.offsetX = 0;
			cfg.offsetY = 0;
			cfg.startX = evt.touches[0].pageX;
			cfg.startY = evt.touches[0].pageY;
			for (var i = 0; i < g_imgList.length; i++) {
				g_imgList[i].style.webkitTransition = "none";
			}
		}

		function touchMove(evt){
			//兼容chrome android，阻止浏览器默认行为
			cfg.offsetX = evt.touches[0].pageX - cfg.startX;
			cfg.offsetY = evt.touches[0].pageY - cfg.startY;
			if( Math.abs(cfg.offsetX) > Math.abs(cfg.offsetY) ){
				evt.preventDefault();
			} 
			g_imgList[miku_index].style.webkitTransform = "translate3d("+cfg.offsetX+"px,0,0)";
			g_imgList[miku_index-1] && (g_imgList[miku_index-1].style.webkitTransform = "translate3d("+ (-cfg.maxWidth +cfg.offsetX) +"px,0,0)");
			g_imgList[miku_index+1] && (g_imgList[miku_index+1].style.webkitTransform = "translate3d("+ (cfg.maxWidth +cfg.offsetX)+"px,0,0)");
		}

		function touchEnd(){
			for (var i = 0; i < g_imgList.length; i++) {
				g_imgList[i].style.webkitTransition = "-webkit-transform 0.2s ease-out";
			}
			//快速切换
			if(Date.now() - cfg.startTime >= 200){
				if(cfg.offsetX > cfg.validWidth){
					// 上一页
					prev();
				}else if(cfg.offsetX < -cfg.validWidth){
					// 下一页
					next();
				}else{
					// 无效滑动，保持当前页面。
					restore();
				}
			}else{
				if(cfg.offsetX > 50){
					// 上一页
					prev();
				}else if(cfg.offsetX < -50){
					// 下一页
					next();
				}else{
					// 无效滑动，保持当前页面。
					restore();
				}
			}
		}

		function heightAutoResponse(obj){
			if(cfg.showStyle == 1){
				if(obj.offsetHeight < cfg.minHeight){
					// 最小高度
					g_bigImg.style.height = cfg.minHeight + 'px';
				}else{
					g_bigImg.style.height = obj.offsetHeight + 'px';
				}
			}
		}


		function setImgSize(obj, img, count){
			if(obj.timer){
				clearTimeout(obj.timer);
			}

			var index = obj.miku_index;
			var count = count ? count : 1;
			if(count == 1){
				if(cfg.maxWidth/cfg.maxHeight <=1){
					// 图册：宽 < 高
					obj.style.maxWidth = cfg.maxWidth + 'px';
					obj.style.maxHeight = 'none';
				}else{
					// 图册：宽 > 高
					obj.style.maxHeight = cfg.maxHeight + 'px';
					obj.style.maxWidth = 'none';
				}		
			}
			
			if(g_imgSize[index]){
				var width = g_imgSize[index]['width'];
				var height = g_imgSize[index]['height'];
			}else{
				if(!img){
					var img = new Image();
					img.src=obj.src;
				}
				var width = img['width'];
				var height = img['height'];
			}
			
			if(width < 2) {
				if(count > 50){
					//加载不到图片
					obj.src = 'source/plugin/img_album/img/nopic.gif';
				}else{
					count++;
					obj.timer = setTimeout(function(){
						setImgSize(obj, img, count);
					}, 1000);
					return;
				}
			}else{
				g_imgSize[index]={'width':width,'height':height};
				
				//大图缩放尺寸
				if(width < cfg.maxWidth){
					var zw = width;
					var zh = height;
				}else {
					var zw = cfg.maxWidth;
					var zh = parseInt(zw/width*height);
				}
				if(zh > cfg.maxHeight){
					var bili = cfg.maxHeight / height;
					zh = cfg.maxHeight;
					zw = parseInt(width*bili);
				}
				obj.style.maxHeight = 'none';
				obj.style.maxWidth = 'none';
				obj.style.height = zh + 'px';
				obj.style.width = zw + 'px';
			}
			obj.parentNode.querySelector('.loadding').style.display = 'none';
			obj.style.display = 'inline-block';
			//高度自适应
			if(obj.miku_index == miku_index){
				heightAutoResponse(g_imgList[miku_index]);
			}
		}

		function loadImg(obj, func, param, img, count){
			if(obj.timer){
				clearTimeout(obj.timer);
			}
			
			var count = count ? count : 1;
			if(!img){
				var img = new Image();
				img.src=obj.src;
			}
			
			var width = img['width'];
			var height = img['height'];
			var ok = true;
			if(width < 5 && height < 10) {
				if(count > 100){
					//加载不到图片
					obj.src = 'source/plugin/img_album/img/nopic.gif';
					ok = false;
				}else{
					count++;
					obj.timer = setTimeout(function(){
						loadImg(obj, func, param, img, count);
					}, 100);
					return;
				}
			}
			if(func){
				func(obj, img, ok);
			}
		}

		var loaded = 4; //记录小图片已加载到第几个单位
		function lazyloadImages(){
			//小图列表中的 网络图片延时加载
			var cur = miku_index + 4;
			if(cur > loaded && cur < cfg.imgNum){
				loaded = cur;
				var imgObj = null;
				imgObj = g_imgList[cur].querySelector('img');
				imgObj.src = imgObj.getAttribute('miku-thumbimg-src');
				lazyload_setImgSize(imgObj);
			}
		}

		function lazyload_setImgSize(obj, img, count){
			if(obj.timer){
				clearTimeout(obj.timer);
			}
			var count = count ? count : 1;
			if(count == 1){
				if(cfg.maxWidth/cfg.maxHeight <=1){
					// 图册：宽 < 高
					obj.style.maxWidth = cfg.maxWidth + 'px';
					obj.style.maxHeight = 'none';
					obj.style.height = 'auto';
					obj.style.width = 'auto';
				}else{
					// 图册：宽 > 高
					obj.style.maxHeight = cfg.maxHeight + 'px';
					obj.style.maxWidth = 'none';
					obj.style.height = 'auto';
					obj.style.width = 'auto';
				}		
			}
			if(!img){
				var img = new Image();
				img.src=obj.src;
			}
			var width = img['width'];
			var height = img['height'];
			if(width < 2) {
				if(count > 50){
					//加载不到图片
					obj.src = 'source/plugin/img_album/img/nopic.gif';
				}else{
					count++;
					obj.timer = setTimeout(function(){
						lazyload_setImgSize(obj, img, count);
					}, 1000);
					return;
				}
			}else{
				//大图缩放尺寸
				if(width < cfg.maxWidth){
					var zw = width;
					var zh = height;
				}else {
					var zw = cfg.maxWidth;
					var zh = parseInt(zw/width*height);
				}
				if(zh > cfg.maxHeight){
					var bili = cfg.maxHeight / height;
					zh = cfg.maxHeight;
					zw = parseInt(width*bili);
				}
				obj.style.maxHeight = 'none';
				obj.style.maxWidth = 'none';
				obj.style.height = zh + 'px';
				obj.style.width = zw + 'px';
			}

			//高度自适应
			if(obj.miku_index == miku_index){
				heightAutoResponse(g_imgList[miku_index]);
			}
		}
}
