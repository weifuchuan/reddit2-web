import * as React from 'react';
import { PostProps } from './props';
import { action, computed } from 'mobx';
import 'moment/locale/zh-cn';
import { message } from 'antd';
import { feelPost } from 'src/kit/web';
import { Comment } from '../common/model/index';

const week = 1000 * 60 * 60 * 24 * 7;

export default abstract class BasePostView<P = {}, S = {}> extends React.Component<PostProps & P, S> {
	@computed
	protected get feel(): 'like' | 'nay' | 'soso' {
		return this.props.store!.myLikePosts.has(this.props.post._id)
			? 'like'
			: this.props.store!.myNayPosts.has(this.props.post._id) ? 'nay' : 'soso';
	}

	@action
	protected clickLike = async () => {
		if (!this.props.store!.logged) {
			message.info('未登录');
			return;
		}
		if (this.feel === 'like') {
			this.props.post.likeCount--;
			this.props.store!.myLikePosts.delete(this.props.post._id);
		} else {
			if (this.feel === 'nay') {
				this.props.post.nayCount--;
				this.props.store!.myNayPosts.delete(this.props.post._id);
			}
			this.props.post.likeCount++;
			this.props.store!.myLikePosts.set(this.props.post._id, true);
		}
		if (this.props.post.createAt + week < new Date().getTime()) {
			return 
		}
		await feelPost(this.props.post._id, this.feel);
	};

	@action
	protected clickNay = async () => {
		if (!this.props.store!.logged) {
			message.info('未登录');
			return;
		}
		if (this.feel === 'nay') {
			this.props.post.nayCount--;
			this.props.store!.myNayPosts.delete(this.props.post._id);
		} else {
			if (this.feel === 'like') {
				this.props.post.likeCount--;
				this.props.store!.myLikePosts.delete(this.props.post._id);
			}
			this.props.post.nayCount++;
			this.props.store!.myNayPosts.set(this.props.post._id, true);
		}
		if (this.props.post.createAt + week < new Date().getTime()) {
			return 
		}
		await feelPost(this.props.post._id, this.feel);
	};

	@computed
	protected get commentsCount(): number {
		type C = { comments: Comment[] };
		function help(c: C): number {
			let sum = 0;
			let stack: C[] = [ c ];
			for (let c = stack[stack.length - 1]; stack.length > 0; c = stack[stack.length - 1]) {
				stack = stack.slice(0, stack.length - 1);
				sum += c.comments.length;
				stack.push(...c.comments);
			}
			return sum;
		}
		return help(this.props.post);
	}
}
