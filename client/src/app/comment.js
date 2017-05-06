import styles from '../css/comment.less';

class Comment {
	checkSetup() {
		let config = [{
			key: 'permalink',
			pass: false
		}];

		if(!this.props.permalink){
			console.error('permalink required, which is the unique id for comments.');
		}else{
			config.find(item => item.key == 'permalink').pass = true;
		}

		return config.every(item => item.pass == true);
	}
	constructor(props) {
		// default props
		this.props = Object.assign({
			dbComment: 'Comment'
		}, props);

		if(!this.checkSetup()){
			return;
		};

		//用户信息
		this.sessionAuthor = 'commentAuthor';

		this.comments = {};

		// initialize
		this.init(props);
	}
	formatData(results) {
		const formatSingle = (data) => {
			let { id, createdAt } = data;

			let obj = {
				id,
				createdAt,
				...data.attributes
			};

			return obj;
		};

		// 非数组类型
		if(!results.length){
			if(results.id){
				return formatSingle(results);
			}else{
				return [];
			}
		}

		// 数组类型
		let tmp = [];

		results.map(item => {
			tmp.push(formatSingle(item));
		});

		return tmp;
	}
	init(options) {
		var query = new AV.Query(this.props.dbComment);

		query.equalTo('permalink', this.props.permalink);
		// query.descending('createdAt');

		query.find().then(results => {
			const list = this.formatData(results);

			// cache
			list.map(c => {
				this.comments[c.id] = c;
			});

			this.render(list);
		}, function (error) {
			this.errorDeal(error);
		});

		// 初始化author
		const recordAuthor = sessionStorage.getItem(this.sessionAuthor);
		if(recordAuthor){
			$('.comment__contentAuthor').val(recordAuthor);
		}

		this.eventHandler();
	}
	eventHandler() {
		const self = this;

		$('input').on('keyup', function(){
			const target = $(this);
			const maxLength = +target.attr('max-length');

			if(this.value.length >= maxLength){
				target.val(this.value.trim().substring(0, maxLength));
			}
		});

		const commentForm = $('#comment-form');

		// 评论提交
		commentForm.on('click', '#comment-box-submit', (e) => {
			e.preventDefault();

			const submitBtn = $(e.target);

			if(submitBtn.hasClass('disabled')){
				return;
			}

			const params = commentForm.serializeArray();

			this.lockSubmit(true);

			if(this.validate(params)){
				// 记录当前用户信息
				const currentAuthor = $('.comment__contentAuthor').val();
				const recordAuthor = sessionStorage.getItem(this.sessionAuthor) || '';

				if(currentAuthor != recordAuthor){
					sessionStorage.setItem(this.sessionAuthor, currentAuthor);
				}

				// 提交
				this.submitParams(params, (data) => {
					this.saveToDB(this.props.dbComment, data, (comment) => {
						$('#comment-list').append(this.commentSingle(this.formatData(comment), 'comment__item'));

						// reset content
						this.resetPlaceholder('content');

						this.lockSubmit(false);
					}, (error) => {
						this.errorDeal(error);
						this.lockSubmit(false);
					});
				});
			}else{
				this.displayErrorMsg('#comment-form-footer', '昵称和评论在一起才是最好的 ^_^');
				this.lockSubmit(false);
			}
		});

		// 回复
		$('#comment-list').on('click', '.btn-reply', function(e) {
			e.preventDefault();

			const element = $(this);
			const displayContent = element.data('content');

			// 滚到回复框
			window.location.href = "#comment-form";

			// 插入回复内容
			if($('.comment__replyComment').length){
				$('.comment__replyComment').find('pre').html(displayContent);
			}else{
				$('<div class="comment--clearfix comment--mb10 comment--fontsizeMeta comment__replyComment"/>').html(`
					<span class="comment--grid-r comment__replyCancel">x</span>
					<pre>${ displayContent }</pre>
				`).insertBefore(commentForm);
			}

			// 更新parentId
			commentForm.find('[name="parentId"]').val(element.attr('data-id'));
		});

		// 回复取消
		$('#wgt-comment').on('click', '.comment__replyCancel', function(){
			const replyComment = $(this).parent('.comment__replyComment');

			// 更新parentId
			commentForm.find('[name="parentId"]').val('');
			replyComment.remove();
		});
	}
	validate(params) {
		let result = false;

		// not empty
		result = params.every(item => {
			const element = $('[name=' + item.name + ']');
			const maxLength = +element.attr('max-length');
			const isRequired = element.attr('required');

			switch(item.name){
				case 'author':
				case 'content':
					return ((isRequired && !!item.value) && (item.value.length < maxLength));
				default:
					return true;
			}
		});

		return result;
	}
	errorDeal(error){
		console.error(error);

		if(error && error.code && error.error){
			alert(`咦，请求出错了😱😱😱麻烦截图联系管理员，错误信息为 -> code:${error.code}, error:${error.error}。`);
		}else{
			alert(`咦，请求出错了，麻烦联系管理员😱😱😱`);
		}
		
		this.lockSubmit(false);
	}
	saveToDB(db, data, onSuccess) {
		// 声明类型
		let commentObject = AV.Object.extend(db);
		
		// 新建对象
		var commentItem = new commentObject();
		
		// 设置数据
		commentItem.set(data);

		// 回复，添加pointer
		if(data.parentId){
			var parentComment = AV.Object.createWithoutData('Comment', data.parentId);
  			commentItem.set('parentComment', parentComment);
		}
		
		commentItem.save().then((data) => {
			onSuccess(data);
		}, function (error) {
			this.errorDeal(error);
		});
	}
	submitParams(params, callback) {
		let data = {
			permalink: this.props.permalink
		};

		params.map(item => {
			data[item.name] = item.value;
		});

		callback(data);

		/*var akismetPromise = new Promise((resolve, reject) => {
			$.post('/api/akismet', data, function(res){
				if(res.status == 'success'){
					resolve(res.data);
				}else{
					reject(res.data);
				}
			});
		});

		akismetPromise.then((res) => {
			let { referrer, isSpam, user_ip, user_agent } = res;

			data = Object.assign(data, {
				referrer,
				isSpam,
				ip: user_ip,
				userAgent: user_agent
			});
		})
		.then(() => {
			// 声明类型
			let commentObject = AV.Object.extend(this.props.dbComment);
			
			// 新建对象
			var commentItem = new commentObject();
			
			// 设置数据
			commentItem.set(data);
			
			commentItem.save().then((data) => {
				// reset content
				this.resetPlaceholder('content');
				
				// render list
				this.list = [this.formatData(data)[0], ...this.list];
				this.render(this.list);
			}, function (error) {
				console.error(error);
			});
		})
		.catch((err) => {
			console.log(err);
		});*/
	}
	lockSubmit(isToLock){
		const form = $('#comment-form');
		const submitBtn = $('#comment-box-submit');

		if(isToLock){
			form.find('input').each(function(){
				$(this).attr('disabled', 'disabled');
			});

			submitBtn.addClass('disabled');
		}else{
			form.find('input').each(function(){
				$(this).removeAttr('disabled');
				submitBtn.removeClass('disabled');
			});
		}
	}
	resetPlaceholder(type) {
		switch(type) {
			case 'author':
				$('.comment__contentAuthor').val('');
				break;
			case 'content':
				$('.comment__contentInput').val('');
				break;
		};

		// 自动磨掉回复内容
		const replyCancel = $('.comment__replyCancel');
		if(replyCancel.length){
			replyCancel.click();
		}
	}
	commentSingle(item, className) {
		let parentContent = '';
		const pId = item.parentId;

		if(pId){
			const c = this.comments[pId];
			let pContent = '';

			if(c && c.content){
				pContent = c.content;

				if(pContent.length > 20){
					pContent = pContent.substring(0, 20) + '...';
				}

				parentContent = `
					<blockquote class="comment--fontsizeMeta comment__quote">
						<p>${ pContent }
							<span class="comment--colorAccent">${ c.author }</span>
						</p>
					</blockquote>
				`;
			}
		}

		return `
			<div class="${className}" id="comment-${item.id}">
				<article>
					<header class="comment__header">
						<span class="comment--colorAccent comment--fontsizeMeta comment__item--author">${item.author} </span>
						<time class="comment--colorMeta comment--fontsizeMeta comment__item--time">${ moment(item.createdAt).format('MM-DD-YYYY hh:mm:ss') }</time>
					</header>
					<section class="comment--mt10">
						${parentContent}
						<pre class="comment__content">${item.content}</pre>
					</section>
					<footer class="comment--tRight">
						<a href="#" class="comment--fontsizeMeta comment--colorAccent btn-reply" data-id="${item.id}" data-content="${item.content.substring(0, 20)}">回复</a>
					</footer>
				</article>
			</div>
		`;
	}
	render(data) {
		let tpl = '';

		if(!data.length){
			tpl = '快来抢占沙发吧~';
			$('#comment-list').html(tpl);

			return false;
		}

		Object.keys(data).map(key => {
			const item = data[key];

			if(!item.author || !item.content || !item.display){
				return;
			}

			const comment = this.commentSingle(item, 'comment__item');

			tpl += `
				${comment}
			`;
		});

		$('#comment-list').html(tpl);
	}
	displayErrorMsg(containerId, msg) {
		let errorTip = $('#comment-form-error');

		if(!errorTip.length){
			errorTip = $('<p/>').attr({
				class: 'comment--grid comment--fontsizeMeta comment--colorError',
				id: 'comment-form-error'
			}).html(msg);

			$(containerId).append(errorTip);
		}else{
			errorTip.html(msg).show();
		}

		setTimeout(() => {
			errorTip.hide();
		}, 2000);
	}
}

export default Comment;