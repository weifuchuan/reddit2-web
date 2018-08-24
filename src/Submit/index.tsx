import * as React from 'react';
import { inject, observer } from 'mobx-react';
import { Store } from '../store/index';
import Frame from '../Frame/index';
import { Community, Post } from 'src/model/index';
import BraftEditor from 'braft-editor';
import 'braft-editor/dist/braft.css';
import Container from '../Container';
import Select from 'react-select';
import './index.scss';
import { Input, List, Tooltip, Tag, Button, message, Spin } from 'antd';
import { action, observable, runInAction, toJS, autorun } from 'mobx';
import db from 'localforage';
import ReactMde, { ReactMdeTypes } from 'react-mde';
import * as Showdown from 'showdown';
import { MdeState } from 'react-mde/lib/definitions/types';
import 'react-mde/lib/styles/css/react-mde-all.css';
import './fontawesome-all.js';
import Tabs from '../Tabs';
import { RawDraftContentState } from 'draft-js';
import Modal from '../Modal';
import { createPost, $ } from 'src/kit/web';
import Dropzone from 'react-dropzone';
const {
	Player,
	ControlBar,
	ReplayControl,
	ForwardControl,
	CurrentTimeDisplay,
	TimeDivider,
	PlaybackRateMenuButton,
	VolumeMenuButton
} = require('video-react');
const { Route, Control } = require('react-keeper');

interface Props {
	store?: Store;
}

interface Draft {
	type: 'md' | 'rt' | 'link';
	title: string;
	content: string;
	createAt: Date;
}

interface SelfState {
	title: string;
	content: string;
	drafts: Draft[];
	mode: 'md' | 'rt';
	mdState: MdeState;
	rtValue: RawDraftContentState | null;
	kid: 'post' | 'imageOrVedio' | 'link';
	oc: boolean;
	link: string;
	posting: boolean;
	rtHtml: string;
	communityId: string;
	subscriptions: Community[];
	preview: {
		uri: string;
		mimetype: string;
	};
	updating: boolean;
}

@inject('store', 'bus')
@observer
export default class Submit extends React.Component<Props> {
	@observable
	private st: SelfState = {
		title: '',
		content: '',
		drafts: [],
		mode: 'rt',
		mdState: { markdown: '' },
		kid: 'post',
		rtValue: null,
		oc: false,
		link: '',
		posting: false,
		rtHtml: '',
		subscriptions: [],
		communityId: '',
		preview: { uri: '', mimetype: '' },
		updating: false
	};

	onSelectCommunity: any;
	draftModal: Modal | null = null;
	draftEditor: BraftEditor | null = null;
	uploadDiv: HTMLDivElement | null = null;

	constructor(props: Props) {
		super(props);
		autorun(async () => {
			const subscriptions = observable(
				await this.props.store!.getCommunities(this.props.store!.me.subscribedCommunities.slice())
			);
			runInAction(() => {
				this.st.subscriptions = subscriptions;
			});
		});
	}

	render() {
		const store = this.props.store!;
		return (
			<React.Fragment>
				<Frame>
					<Container
						main={
							<div className="flex">
								<div
									style={{
										borderBottom: '1px #fff solid',
										margin: '1em 0 1em 0.1em',
										flexDirection: 'row',
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'flex-end'
									}}
								>
									<span style={{ fontSize: '1.5em' }}>创建一个帖子</span>
									<a onClick={this.openDraft}>草稿({this.st.drafts.length})</a>
								</div>
								<Select
									className="submit-select"
									options={[
										{
											label: 'YOUR PROFILE',
											options: [ { label: `u/${store.me.username}`, value: 'me' } ]
										},
										{
											label: '订阅',
											options: this.st.subscriptions.map((c) => ({
												label: `c/${c.name}`,
												value: `${c._id}`
											}))
										}
									]}
									onChange={action((item: any) => {
										this.st.communityId = item.value;
									})}
								/>

								<Tabs
									style={{ backgroundColor: '#fff' }}
									tabs={[
										{
											title: '帖子',
											content: (
												<React.Fragment>
													<Input
														placeholder="标题"
														style={{
															borderRadius: 0,
															padding: '1em',
															borderLeft: 'none',
															borderRight: 'none'
														}}
														size="large"
														value={this.st.title}
														onInput={this.onInputTitle}
													/>
													<div style={{ position: 'relative' }} className="flex editor-hw">
														<a
															style={{
																position: 'absolute',
																right: '1em',
																top: '48px',
																zIndex: 10
															}}
															onClick={(e) => {
																e.preventDefault();
																runInAction(
																	() =>
																		(this.st.mode =
																			this.st.mode === 'rt' ? 'md' : 'rt')
																);
															}}
														>
															{this.st.mode === 'rt' ? '使用markdown' : '使用富文本'}
														</a>
														<div
															className="flex"
															style={{ display: this.st.mode === 'md' ? 'none' : 'flex' }}
														>
															<BraftEditor
																height={250}
																controls={[
																	'bold',
																	'italic',
																	'underline',
																	'link',
																	'strike-through',
																	'code',
																	'superscript',
																	'split',
																	'headings',
																	'list_ul',
																	'list_ol',
																	'split',
																	'emoji',
																	'media'
																]}
																// onRawChange={(content) => {
																// 	this.st.rtValue = content;
																// }}
																onHTMLChange={action((html: string) => {
																	this.st.rtHtml = html;
																})}
																ref={(r) => (this.draftEditor = r)}
																media={{
																	allowPasteImage: true, // 是否允许直接粘贴剪贴板图片（例如QQ截图等）到编辑器
																	image: true, // 开启图片插入功能
																	video: true, // 开启视频插入功能
																	audio: true, // 开启音频插入功能
																	validateFn: (file: File) => {
																		return file.size < 1024 * 1024 * 40;
																	}, // 指定本地校验函数，说明见下文
																	uploadFn: async (params: {
																		file: File;
																		progress: (progress: number) => void; // progress为0到100
																		libraryId: string;
																		success: (
																			param: {
																				url: string;
																				meta?: {
																					id?: string;
																					title?: string;
																					alt?: string;
																					loop?: boolean; // 指定音视频是否循环播放
																					autoPlay?: boolean; // 指定音视频是否自动播放
																					controls?: boolean; // 指定音视频是否显示控制栏
																					poster?: string; // 指定视频播放器的封面
																				};
																			}
																		) => void; // res须为一个包含已上传文件url属性的对象：
																		error: (err: any) => void;
																	}) => {
																		try {
																			const resp = await $.authUploadFiles({
																				file: params.file
																			});
																			const {
																				name,
																				uri,
																				mimetype
																			} = resp.medias.find(
																				(media) => media.name === 'file'
																			)!;
																			params.success({
																				url: uri,
																				meta: {
																					loop: false,
																					autoPlay: false,
																					controls: true
																				}
																			});
																		} catch (err) {
																			params.error(err);
																		}
																	}, // 指定上传函数，说明见下文
																	removeConfirmFn: null, // 指定删除前的确认函数，说明见下文
																	onRemove: null, // 指定媒体库文件被删除时的回调，参数为被删除的媒体文件列表(数组)
																	onChange: null, // 指定媒体库文件列表发生变化时的回调，参数为媒体库文件列表(数组)
																	onInsert: null // 指定从媒体库插入文件到编辑器时的回调，参数为被插入的媒体文件列表(数组)
																}}
															/>
														</div>
														<div
															className="flex"
															style={{ display: this.st.mode === 'rt' ? 'none' : 'flex' }}
														>
															<ReactMde
																className={'editor-hw'}
																layout="tabbed"
																onChange={(mdeState: ReactMdeTypes.MdeState) => {
																	runInAction(() => (this.st.mdState = mdeState));
																}}
																editorState={this.st.mdState}
																generateMarkdownPreview={(markdown) =>
																	Promise.resolve(this.converter.makeHtml(markdown))}
															/>
														</div>
													</div>
												</React.Fragment>
											)
										},
										{
											title: '图像 & 视频',
											content: (
												<div className="flex">
													<Input
														placeholder="标题"
														style={{
															borderRadius: 0,
															padding: '1em',
															borderLeft: 'none',
															borderRight: 'none'
														}}
														size="large"
														value={this.st.title}
														onInput={this.onInputTitle}
													/>
													<div
														style={{ display: 'flex', flexDirection: 'row' }}
														ref={(r) => (this.uploadDiv = r)}
													>
														<Dropzone
															name="file"
															onDrop={async (accepted, rejected) => {
																if (accepted.length > 0) {
																	const file = accepted[0];
																	if (
																		/^image\/.+/.test(file.type) ||
																		/^video\/.+/.test(file.type)
																	) {
																		try {
																			runInAction(() => {
																				this.st.updating = true;
																				window.document.addEventListener(
																					'click',
																					this.clickOutUpdating
																				);
																			});
																			const resp = await $.authUploadFiles({
																				file
																			});
																			const media = resp.medias.find(
																				(m) => m.name === 'file'
																			)!;
																			runInAction(() => {
																				this.st.content = media.uri;
																				this.st.preview.uri = media.uri;
																				this.st.preview.mimetype =
																					media.mimetype;
																			});
																		} catch (err) {
																			message.error('上传失败');
																			console.error(err);
																		}
																		runInAction(() => {
																			this.st.updating = false;
																			window.document.removeEventListener(
																				'click',
																				this.clickOutUpdating
																			);
																		});
																	}
																}
															}}
															maxSize={1024 * 1024 * 50}
															inputProps={{ accept: 'image/*,video/*' }}
															accept={'image/*,video/*'}
															style={{
																borderRadius: '0',
																border: 'solid 2px #aaaaaa',
																height: '300px',
																width: '200px'
															}}
														>
															<div
																style={{
																	width: '100%',
																	height: '100%',
																	display: 'flex',
																	flexDirection: 'column',
																	justifyContent: 'center',
																	alignItems: 'center'
																}}
															>
																<p>拖动视频或图像文件进来</p>
																<p>或单击此处</p>
															</div>
														</Dropzone>
														<div style={{ flex: 1, display: 'flex' }}>
															{/^image.+/.test(this.st.preview.mimetype) ? (
																<img src={this.st.preview.uri} height="300" />
															) : /^video.+/.test(this.st.preview.mimetype) ? (
																<Player height="300" fluid={false}>
																	<source src={this.st.preview.uri} />
																	<ControlBar>
																		<ReplayControl seconds={10} order={1.1} />
																		<ForwardControl seconds={30} order={1.2} />
																		<CurrentTimeDisplay order={4.1} />
																		<TimeDivider order={4.2} />
																		<PlaybackRateMenuButton
																			rates={[ 5, 2, 1, 0.5, 0.1 ]}
																			order={7.1}
																		/>
																		<VolumeMenuButton disabled />
																	</ControlBar>
																</Player>
															) : null}
														</div>
													</div>
												</div>
											)
										},
										{
											title: '链接',
											content: (
												<React.Fragment>
													<Input
														placeholder="标题"
														style={{
															borderRadius: 0,
															padding: '1em',
															borderLeft: 'none',
															borderRight: 'none'
														}}
														size="large"
														value={this.st.title}
														onInput={this.onInputTitle}
													/>
													<Input
														placeholder="Link"
														style={{
															borderRadius: 0,
															padding: '1em',
															borderLeft: 'none',
															borderRight: 'none',
															borderTop: 'none',
															borderBottom: 'none',
															margin: '1em 0 1em 0'
														}}
														type="url"
														size="large"
														value={this.st.link}
														onInput={this.onInputLink}
													/>
												</React.Fragment>
											)
										}
									]}
									onSelect={action((i) => {
										switch (i) {
											case 0:
												this.st.kid = 'post';
												break;
											case 1:
												this.st.kid = 'imageOrVedio';
												break;
											case 2:
												this.st.kid = 'link';
												break;
										}
									})}
								/>
								<div
									style={{
										display: 'flex',
										flexDirection: 'row',
										justifyContent: 'space-between',
										alignItems: 'center',
										padding: '0.5em 0 0.1em 0',
										backgroundColor: '#fff',
										borderTop: '#eea solid 1px'
									}}
								>
									<Tooltip placement="top" title={'标记为“原创”'}>
										<Tag.CheckableTag
											checked={this.st.oc}
											onChange={(c) => runInAction(() => (this.st.oc = c))}
										>
											OC
										</Tag.CheckableTag>
									</Tooltip>
									<div
										style={{
											display: 'flex',
											flexDirection: 'row',
											justifyContent: 'space-between'
										}}
									>
										<Button style={{ borderRadius: 0 }} onClick={this.onSaveDraft}>
											保存草稿
										</Button>
										<Button
											type={'primary'}
											onClick={this.onPost}
											style={{ marginLeft: '1em', borderRadius: 0 }}
											loading={this.st.posting}
											disabled={
												this.st.title.trim() === '' ||
												this.st.communityId === '' ||
												(this.st.mode === 'md' && this.st.mdState.markdown!.trim() === '') ||
												(this.st.kid === 'link' && this.st.link.trim() === '')
											}
										>
											发布
										</Button>
									</div>
								</div>
							</div>
						}
						lesser={<div />}
						style={{
							margin: '0 1.5em 0',
							width: 'calc(100% - 3em)'
						}}
					/>
				</Frame>
				<Modal height={'75%'} width={'80%'} ref={(r) => (this.draftModal = r)}>
					<div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
						<div style={{ borderBottom: 'solid 1px #aaa', padding: '1em 1em 0.5em 1em' }}>
							<span>草稿（存于本机）</span>
						</div>
						<div
							style={{
								flex: 1,
								display: 'flex',
								flexDirection: 'column',
								padding: '1em 1em 0.5em 1em'
							}}
						>
							{this.st.drafts.length === 0 ? (
								<div
									style={{
										flex: 1,
										display: 'flex',
										justifyContent: 'center',
										alignItems: 'center'
									}}
								>
									<span>无</span>
								</div>
							) : (
								<div style={{ flex: 1, overflow: 'auto' }}>
									<List
										bordered={false}
										itemLayout={'vertical'}
										dataSource={this.st.drafts.slice()}
										renderItem={(item: Draft) => {
											return (
												<List.Item
													key={item.createAt.toString()}
													actions={[
														<a
															onClick={action(() => {
																this.st.title = item.title;
																if (item.type === 'rt') {
																	(this.draftEditor! as any).setContent(
																		item.content,
																		'html'
																	);
																	this.st.rtHtml = item.content;
																} else if (item.type === 'md') {
																	this.st.mdState = {
																		markdown: item.content
																	};
																} else if (item.type === 'link') {
																	this.st.link = item.content;
																}
																this.draftModal!.hide();
															})}
														>
															填入
														</a>,
														<a
															onClick={action(async () => {
																const i = this.st.drafts.findIndex(
																	(d) =>
																		d.createAt.toString() ===
																		item.createAt.toString()
																);
																if (i !== -1) {
																	this.st.drafts.splice(i, 1);
																	await this.syncDrafts();
																}
															})}
														>
															删除
														</a>
													]}
												>
													<List.Item.Meta
														title={`${item.title}（${item.createAt.toLocaleString()}）`}
														description={item.content.substr(0, 500)}
													/>
												</List.Item>
											);
										}}
									/>
								</div>
							)}
						</div>
					</div>
				</Modal>
				<div
					style={{
						display: this.st.updating ? 'flex' : 'none',
						flexDirection: 'column',
						position: 'fixed',
						left: 0,
						top: 0,
						height: '100%',
						width: '100%',
						zIndex: 20000,
						justifyContent: 'center',
						alignItems: 'center',
						backgroundColor: '#efefff',
						opacity: 0.5
					}}
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
					}}
				>
					<div style={{ padding: '1em', backgroundColor: '#fff' }}>
						<Spin size="large" />
						<span>上传中...</span>
					</div>
				</div>
			</React.Fragment>
		);
	}

	private clickOutUpdating = (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
	};

	private converter = new Showdown.Converter({
		tables: true,
		simplifiedAutoLink: true,
		strikethrough: true,
		tasklists: true
	});

	@action
	private onInputTitle = (e: any) => {
		this.st.title = e.target.value;
	};

	@action
	private onInputLink = (e: any) => {
		this.st.link = e.target.value.trim();
	};

	private openDraft = () => {
		this.draftModal!.show();
	};

	@action
	private onSaveDraft = async () => {
		let draft: Draft | null = null;
		if (this.st.kid === 'post') {
			if (this.st.mode === 'md') {
				draft = {
					type: 'md',
					title: this.st.title,
					content: this.st.mdState.markdown!,
					createAt: new Date()
				};
			} else {
				draft = {
					type: 'rt',
					title: this.st.title,
					content: this.st.rtHtml,
					createAt: new Date()
				};
			}
		} else if (this.st.kid === 'link') {
			draft = {
				type: 'link',
				title: this.st.title,
				content: this.st.link,
				createAt: new Date()
			};
		}
		if (draft) {
			this.st.drafts.unshift(draft);
			await this.syncDrafts();
		}
	};

	private syncDrafts = async () => {
		const drafts = toJS(this.st.drafts);
		await db.setItem('drafts', drafts);
	};

	@action
	private onPost = async () => {
		this.st.posting = true;
		if (this.st.kid === 'post') {
			if (this.st.mode === 'md') {
				if (this.st.mdState.html) {
					this.st.content = this.st.mdState.html;
				} else {
					this.st.content = this.converter.makeHtml(this.st.mdState.markdown!);
				}
			} else if (this.st.mode === 'rt') {
				this.st.content = this.st.rtHtml;
			}
		} else if (this.st.kid === 'link') {
			this.st.content = this.st.link;
		}
		// console.log(this.st.title, this.st.content, this.st.kid, this.st.oc ? [ 'oc' ] : [], this.st.communityId);
		try {
			let post: Post;
			if (this.st.communityId && this.st.communityId === 'me')
				post = await createPost(this.st.title, this.st.content, this.st.kid, this.st.oc ? [ 'oc' ] : []);
			else
				post = await createPost(
					this.st.title,
					this.st.content,
					this.st.kid,
					this.st.oc ? [ 'oc' ] : [],
					this.st.communityId
				);
			this.props.store!.addPost(post);
			message.success('发布成功');
			runInAction(() => {
				this.st.title = '';
				this.st.content = '';
				this.st.oc = false;
				this.st.communityId = '';
			});
			Control.go(`/user/${this.props.store!.me.username}`);
		} catch (err) {
			message.error(err.toString());
		}
		runInAction(() => {
			this.st.posting = false;
		});
	};

	componentDidMount() {
		(async () => {
			const drafts = await db.getItem<Draft[]>('drafts');
			runInAction(() => (this.st.drafts = observable(drafts ? drafts : [])));
		})();
	}
}
