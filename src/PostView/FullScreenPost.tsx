import * as React from 'react';
import { inject, observer } from 'mobx-react';
import { Store } from 'src/store';
import { Post, Community, User, Comment } from 'src/model';
import './FullScreenPost.scss';
import { Bus } from 'src/bus';
import BasePostView from './BasePostView';
import { Icon, Input, Button, List, message } from 'antd';
import Container from '../Container';
import moment from 'moment';
import 'moment/locale/zh-cn';
import { observable, runInAction, action } from 'mobx';
const { Player, ControlBar } = require('video-react');
moment.locale('zh-cn');
const { Control } = require('react-keeper');
import ext2mime from '../kit/ext2mime';
import './Card.scss';
import BraftEditor from 'braft-editor';
import 'braft-editor/dist/braft.css';
import { commentPost } from 'src/kit/web';
import { code } from 'src/common/api';
import _ from 'lodash';

interface Props {
	store?: Store;
	bus?: Bus;
	post: Post;
	onClose: () => void;
}

interface SelfState {
	community: Community | null;
	author: User | null;
}

@inject('store', 'bus')
@observer
export default class FullScreenPost extends BasePostView<Props> {
	@observable
	private st: SelfState = {
		community: null,
		author: null
	};
	commentEditor: CommentEditor | null = null;

	render() {
		const { post } = this.props;
		const store = this.props.store!;
		const cName = this.st.community
			? `c/${this.st.community.name}`
			: this.st.author ? `u/${this.st.author.username}` : '';
		const aName = this.st.author ? `u/${this.st.author.username}` : '';
		return (
			<div className={'FullScreenPost'} onClick={this.props.onClose}>
				<div
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
					}}
					style={{ minHeight: window.innerHeight - 48 }}
				>
					<div>
						<div>
							<div>
								<Icon
									type="caret-up"
									style={{ color: this.feel === 'like' ? '#4169E1' : '#696969', fontSize: 20 }}
									onClick={this.clickLike}
								/>
								<span style={{ fontSize: 15, color: '#fff', margin: '0 12px 0 12px' }}>
									{post.likeCount - post.nayCount}
								</span>
								<Icon
									type="caret-down"
									style={{ color: this.feel === 'nay' ? '#F08080' : '#696969', fontSize: 20 }}
									onClick={this.clickNay}
								/>
								<span style={{ margin: '0 12px 0 12px', color: '#fff' }}>{post.title}</span>
							</div>
							<div onClick={this.props.onClose}>
								<Icon type="close" style={{ color: '#fff' }} />
								<span style={{ color: '#fff' }}>关闭</span>
							</div>
						</div>
					</div>
					<div>
						<Container
							main={
								<div
									style={{ padding: '1em' }}
									className="CardContent"
									onClick={(e) => {
										e.preventDefault();
										this.props.onClick();
									}}
								>
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
										<span className="Point">•</span>
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
										<span className="PostedBy">
											发布于 {moment(new Date(post.createAt)).fromNow()}
										</span>
									</div>
									<div className={'CardTitle'}>
										<span>{post.title}</span>
									</div>
									<div className="CardContentInner2">
										{post.kid === 'post' ? (
											<div dangerouslySetInnerHTML={{ __html: post.content }} />
										) : post.kid === 'link' ? (
											<a onClick={() => window.open(post.content)}>{post.content}</a>
										) : ext2mime[post.content.substring(post.content.lastIndexOf('.') + 1)] ===
										'image' ? (
											<img src={post.content} style={{ width: '100%' }} />
										) : (
											<Player autoPlay={true} fluid={true}>
												<source src={post.content} />
												<ControlBar autoHide={false} />
											</Player>
										)}
									</div>
									<div className="CardBottomBar" style={{ justifyContent: 'space-between' }}>
										<a>
											<Icon type="message" />
											<span>{this.commentsCount} 评论</span>
										</a>
										<a>
											{(post.likeCount / (post.likeCount + post.nayCount) * 100)
												.toString()
												.substring(0, 4)}% 点赞
										</a>
									</div>
									{store.logged ? (
										<CommentEditor
											ref={(r) => (this.commentEditor = r)}
											onComment={this.onComment}
										/>
									) : null}
									<div className="CommentPanel">
										<List
											dataSource={post.comments.slice()}
											renderItem={(comment: Comment) => {
												return (
													<List.Item>
														<CommentComp
															key={comment.createAt.toString()}
															comment={comment}
															post={this.props.post}
														/>
													</List.Item>
												);
											}}
											bordered={false}
											locale={{ emptyText: '暂无评论' }}
										/>
									</div>
								</div>
							}
							lesser={<div style={{ backgroundColor: '#aaa', height: '100%', width: '100%' }} />}
						/>
					</div>
				</div>
			</div>
		);
	}

	@action
	private onComment = async (html: string) => {
		const cmt: Comment = {
			authorId: this.props.store!.me._id,
			content: html,
			createAt: new Date().getTime(),
			likeCount: 0,
			nayCount: 0,
			comments: []
		};
		this.props.post.comments.unshift(observable(cmt));
		try {
			await commentPost(this.props.post._id, cmt, []);
			this.commentEditor!.clear();
		} catch (err) {
			message.error(err);
		}
	};

	componentDidMount() {
		console.log('setFrameInnerContainerHiddenOverflow');
		this.props.bus!.emit('setFrameInnerContainerHiddenOverflow');
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

	componentWillUnmount() {
		console.log('setFrameInnerContainerAutoOverflow');
		this.props.bus!.emit('setFrameInnerContainerAutoOverflow');
	}
}

@inject('store')
@observer
class CommentComp extends React.Component<{ comment: Comment; post: Post; store?: Store }> {
	@observable private author: User | null = null;
	@observable private commenting: boolean = false;
	commentEditor: any;

	render() {
		const comment = this.props.comment;
		return (
			<div className="CommentComp">
				<div>
					<div />
				</div>
				<div>
					<a
						className="PostedByA"
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							Control.go(`/user/${this.author!.username}`);
						}}
					>
						{this.author ? this.author.username : ''}
					</a>
					<span className="Point">•</span>
					<span className="PostedBy">{moment(new Date(comment.createAt)).fromNow()}</span>
				</div>
				<div dangerouslySetInnerHTML={{ __html: comment.content }} />
				<div>
					<a onClick={action(() => (this.commenting = !this.commenting))}>
						<Icon type="message" />
						<span>评论</span>
					</a>
				</div>
				{this.commenting ? (
					<CommentEditor onComment={this.onComment} ref={(r) => (this.commentEditor = r)} />
				) : null}
				{comment.comments.length > 0 ? (
					<List
						dataSource={comment.comments.slice()}
						renderItem={(comment: Comment) => {
							return (
								<List.Item>
									<CommentComp
										key={comment.createAt.toString()}
										comment={comment}
										post={this.props.post}
									/>
								</List.Item>
							);
						}}
						bordered={false}
						split={true}
					/>
				) : null}
			</div>
		);
	}

	@action
	private onComment = async (html: string) => {
		const cmt: Comment = {
			authorId: this.props.store!.me._id,
			content: html,
			createAt: new Date().getTime(),
			likeCount: 0,
			nayCount: 0,
			comments: []
		};
		this.props.comment.comments.unshift(observable(cmt));
		const indexes: number[] = [];
		let stack: [{ comments: Comment[]; createAt: number }, number[]][] = [ [ this.props.post, [] ] ];
		const record: [{ comments: Comment[]; createAt: number }, number[]][] = [];
		for (
			let [ c, idxs ] = stack[stack.length - 1];
			stack.length > 0;
			stack.length > 0 ? ([ c, idxs ] = stack[stack.length - 1]) : null
		) {
			stack = stack.slice(0, stack.length - 1);
			if (c.comments.length > 0) {
				for (let i = 0; i < c.comments.length; i++) {
					stack.push([ c.comments[i], [ ...idxs, i ] ]);
				}
			}
			record.push([ c, idxs ]);
		}
		try {
			await commentPost(
				this.props.post._id,
				cmt,
				record.find(([ c, i ]) => c.createAt === this.props.comment.createAt)![1]
			);
			this.commentEditor!.clear();
			runInAction(() => {
				this.commenting = false;
			});
		} catch (err) {
			message.error(err);
		}
	};

	componentDidMount() {
		const store = this.props.store!;
		store.getUser(this.props.comment.authorId).then(action((user: User) => (this.author = user)));
	}
}

@observer
class CommentEditor extends React.Component<{ onComment: (content: string) => void }> {
	@observable private comment: string = '';
	editor: any = null;
	render() {
		return (
			<div className="CommentForm">
				<span>评论</span>
				<BraftEditor
					ref={(r) => (this.editor = r)}
					height={120}
					onHTMLChange={this.onInput}
					controls={[
						'bold',
						'italic',
						'link',
						'strike-through',
						'code',
						'superscript',
						'headings',
						'list_ul',
						'list_ol',
						'blockquote',
						'undo',
						'redo',
						'clear'
					]}
				/>
				<Button type="primary" onClick={this.onComment} disabled={this.editor ? this.editor.isEmpty() : false}>
					评论
				</Button>
			</div>
		);
	}

	clear() {
		this.editor.clear();
	}

	private onComment = () => {
		this.props.onComment(this.comment);
	};
	@action
	private onInput = (html: string) => {
		this.comment = html;
		_.debounce(() => {
			this.forceUpdate();
		}, 800);
	};
}
