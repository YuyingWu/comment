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
			dbComment: 'Comment',
			dbReply: 'Reply'
		}, props);

		if(!this.checkSetup()){
			return;
		}

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
		query.descending('createdAt');

		query.find().then(results => {
			this.list = this.formatData(results);
			this.render(this.list);
		}, function (error) {
			console.log('query error');
		});

		this.eventHandler();
		this.submitHandler();
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

		// 回复
		$('#comment-list').on('click', '.btn-reply', function(e){
			e.preventDefault();

			const element = $(this);
			const id = element.data('id');
			// const commentItem = element.parents('.comment__item');
			const commentBlock = element.parents('article');
			let replyForm = commentBlock.find('.reply-form');

			if(replyForm.length){
				replyForm.toggle();
				return;
			}

			replyForm = $('<footer class="reply-form"/>').html(`
				<form class="comment__form">
					<label for="author">
						<span>Authur: </span>
						<input type="text" 
							name="author" 
							class="comment-author" 
							required 
							max-length="15">
					</label>
					<label for="content">
						<span>Content: </span>
						<input type="text" 
							name="content" 
							class="comment-content" 
							required
							max-length="150">
					</label>
					<a href="#" class="reply-submit" data-id="${id}">提交</a>
				</form>
			`);

			replyForm.appendTo(commentBlock[0]);
		});

		// 回复提交
		$('#comment-list').on('click', '.reply-submit', function(e){
			e.preventDefault();

			const element = $(this);
			const formElement = element.parents('form')[0];
			const params = $(formElement).serializeArray();
			const parentId = element.data('id');
			const commentBlock = element.parents('article');

			if(self.validate(params)){
				self.submitParams(params, (data) => {
					data.parentId = parentId;

					self.saveToDB(self.props.dbReply, data, (reply) => {
						// const parentElement = $('#comment-' + parentId);
						const replyFormat = self.formatData(reply);

						$(self.commentSingle(replyFormat, 'comment__reply')).insertAfter(commentBlock);

						// 干掉reply-form
						const replyForm = element.parents('.reply-form');

						self.resetPlaceholder('content');

						replyForm.hide();
					}, (error) => {
						self.errorDeal(error);
					});
				});
			}else{
				console.log('invalid input');
			}
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
	submitHandler() {
		const formElement = $('#comment-form');

		formElement.on('click', '#comment-box-submit', (e) => {
			e.preventDefault();

			const params = formElement.serializeArray();

			if(this.validate(params)){
				this.submitParams(params, (data) => {
					this.saveToDB(this.props.dbComment, data, (comment) => {
						$('#comment-list').prepend(this.commentSingle(this.formatData(comment), 'comment__item'));
					}, (error) => {
						this.errorDeal(error);
					});
				});
			}else{
				console.log('invalid input');
			}
		});
	}
	errorDeal(error){
		console.log(error);
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
	resetPlaceholder(type) {
		switch(type) {
			case 'author':
				$('.comment-author').val('');
				break;
			case 'content':
				$('.comment-content').val('');
				break;
		}
	}
	commentSingle(item, className) {
		return `
			<div class="${className}" id="comment-${item.id}">
				<article>
					<div class="comment--clearfix">
						<a href="#" class="comment--fontsizeMeta comment--colorAccent comment--grid-r btn-reply" data-id="${item.id}">回复</a>
						<div class="comment--grid">
							<span class="comment--colorAccent comment--fontsizeMeta comment__item--author">${item.author} </span>
							<time class="comment--colorMeta comment--fontsizeMeta comment__item--time">${ moment(item.createdAt).fromNow() }</time>
						</div>
					</div>
					<pre class="comment__content">${item.content}</pre>
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

			if(!item.author || !item.content){
				return;
			}

			const comment = this.commentSingle(item, 'comment__item');

			tpl += `
				${comment}
			`;
		});

		$('#comment-list').html(tpl);

		this.renderReplies();
	}
	renderReplies(callback) {
		var query = new AV.Query(this.props.dbReply);

		query.equalTo('permalink', this.props.permalink);

		query.find().then(results => {
			results = this.formatData(results);

			results.map(item => {
				const parentElement = $('#comment-' + item.parentId);
				// const commentBlock = parentElement.find('article')[0];

				if(parentElement.length){
					parentElement.append(this.commentSingle(item, 'comment__reply'));

					// 回复按时间倒序排
					// $(this.commentSingle(item, 'comment__item comment__reply')).insertAfter($(commentBlock));
				}
			});
		}, function (error) {
			console.log('query error');
		});
	}
}

export default Comment;