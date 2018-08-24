import * as React from 'react';
import { inject, observer } from 'mobx-react';
import { Community } from '../model';
import { observable, runInAction } from 'mobx';
import './Card.scss';
import { User } from 'src/common/model';
import moment from 'moment';
import 'moment/locale/zh-cn';
import { Icon, message, Modal } from 'antd';

const { Player, ControlBar } = require('video-react');
moment.locale('zh-cn');
const { Control } = require('react-keeper');
import ext2mime from '../kit/ext2mime';
import BasePostView from './BasePostView';
import { deletePost } from 'src/kit/web';

interface SelfState {
	community: Community | null;
	author: User | null;
}

@inject('store')
@observer
export default class Card extends BasePostView<{ onClickComment: () => void }> {
	@observable
	private st: SelfState = {
		community: null,
		author: null
	};

	render() {
		const post = this.props.post;
		const cName = this.st.community
			? `c/${this.st.community.name}`
			: this.st.author ? `u/${this.st.author.username}` : '';
		const aName = this.st.author ? `u/${this.st.author.username}` : '';
		return (
			<div className="Card">
				<div className="LikeAndNay">
					<Icon
						type="caret-up"
						style={{ color: this.feel === 'like' ? '#4169E1' : '#696969', fontSize: 20 }}
						onClick={this.clickLike}
					/>
					<span style={{ fontSize: 15 }}>{post.likeCount - post.nayCount}</span>
					<Icon
						type="caret-down"
						style={{ color: this.feel === 'nay' ? '#F08080' : '#696969', fontSize: 20 }}
						onClick={this.clickNay}
					/>
				</div>
				<div
					className="CardContent"
					onClick={(e) => {
						e.preventDefault();
						this.props.onClick();
					}}
				>
					<div className={'CardContentOver'} />
					<div>
						<a
							className="ObviousLink"
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								if (post.communityId) {
									Control.go(`/c/${this.st.community!.name}`);
								} else {
									Control.go(`/user/${this.st.author!.username}`);
								}
							}}
						>
							{cName}
						</a>
						<span className="Point" role="presentation">
							•
						</span>
						<span className="PostedBy">由</span>
						<a
							className="PostedByA"
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								Control.go(`/user/${this.st.author!.username}`);
							}}
						>
							{aName}
						</a>
						<span className="PostedBy">发布于 {moment(new Date(post.createAt)).fromNow()}</span>
						{this.props.store!.logged && this.props.store!.me._id === post.authorId ? (
							<div className="DeletePost" onClick={this.onDelete}>
								删除
							</div>
						) : null}
					</div>
					<div className={'CardTitle'}>
						<span>{post.title}</span>
					</div>
					<div className="CardContentInner">
						{post.kid === 'post' ? (
							<div style={{ maxHeight: '250px' }} dangerouslySetInnerHTML={{ __html: post.content }} />
						) : post.kid === 'link' ? (
							<a href={post.content}>{post.content}</a>
						) : ext2mime[post.content.substring(post.content.lastIndexOf('.') + 1)] === 'image' ? (
							<img src={post.content} style={{ width: '100%' }} />
						) : (
							<Player autoPlay={true} fluid={true} muted={true}>
								<source src={post.content} />
								<ControlBar autoHide={false} />
							</Player>
						)}
					</div>
				</div>
				<div className="CardBottomBar">
					<a onClick={this.props.onClickComment}>
						<Icon type="message" />
						<span>{this.commentsCount} 评论</span>
					</a>
				</div>
			</div>
		);
	}

	private onDelete: React.MouseEventHandler<HTMLDivElement> = async (e) => {
		e.stopPropagation();
		e.preventDefault();

		Modal.confirm({
			title: '确定删除？',
			content: '删除后将无法恢复',
			okText: 'Yes',
			okType: 'danger',
			cancelText: 'No',
			onOk: async () => {
				try {
					await deletePost(this.props.post._id);
					this.props.store!.deletePost(this.props.post._id);
				} catch (err) {
					message.error(err);
				}
			},
			onCancel() {}
		});
	};

	componentDidMount() {
		(async () => {
			const u = await this.props.store!.getUser(this.props.post.authorId);
			runInAction(() => (this.st.author = u));
		})();
		(async () => {
			let comm: Community;
			if (this.props.post.communityId) {
				comm = (await this.props.store!.getCommunities([ this.props.post.communityId ]))[0];
				runInAction(() => {
					this.st.community = comm;
				});
			}
		})();
	}
}
