import Comment from "./comment";

var APP_ID = 'wPyQjUmvJiSYs1ovT7uGsNE0-gzGzoHsz';
var APP_KEY = 'j182JIXghHrneWAiBDaqmuhR';
AV.init({
  appId: APP_ID,
  appKey: APP_KEY
});

new Comment({
	permalink: $('#wgt-comment').data('permalink'),
	dbComment: 'Comment',
	dbReply: 'Reply'
});