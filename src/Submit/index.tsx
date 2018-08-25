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
						lesser={
							<div className={'Slider'}>
								<div>
									<div>
										<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 43">
											<g fill="none" fillRule="evenodd">
												<g fill="#0DD3BB" transform="translate(0 4)">
													<ellipse
														cx="25.492"
														cy="22.2631"
														transform="rotate(5 25.492 22.263)"
														rx="17.6396"
														ry="13.9883"
													/>
													<ellipse
														cx="19.3519"
														cy="17.9699"
														transform="rotate(5 19.352 17.97)"
														rx="14.7297"
														ry="16.0688"
													/>
													<ellipse
														cx="14.0251"
														cy="27.7862"
														transform="rotate(5 14.025 27.786)"
														rx="8.4751"
														ry="8.9243"
													/>
													<ellipse
														cx="11.808"
														cy="17.4531"
														transform="rotate(5 11.808 17.453)"
														rx="10.7695"
														ry="10.8575"
													/>
													<ellipse
														cx="12.1168"
														cy="22.4429"
														transform="rotate(5 12.117 22.443)"
														rx="8.4751"
														ry="8.9243"
													/>
												</g>
												<path
													fill="#FFF"
													d="M35.6875 31.5625c-1.3275 1.8696-6.7017 5.0483-8.7188 6.0313-2.0174.983-13.478 2.1465-15.625-.6876-1.5625-2.0624-.9687-4.625 1-6.1562C9.6563 29.2812 8.125 27.8437 7 24.9062c-.0872-.2277-1.1015-1.763-.875-1.7812l.9375-4.0313c.8158-2.9308 4.2118-5.1638 6.7992-6.5715 2.3198-1.2615 4.9067-1.934 7.5113-2.1714 2.1052-.192 4.259-.101 6.277.554 2.0182.6552 4.2956 1.063 5.5063 2.8765 0 0 1.5532 3.6305 1.6736 5.5487.1204 1.9177-2.0402 6.1206-2.0402 6.1206"
												/>
												<path
													fill="#FFF"
													d="M31.5665 34.5708c.6293 1.944.9 4.0143.794 6.0635 0 0-.473 1.3654-6.7204 1.3654-6.2478 0-7.6077-.7104-7.6077-.7104.047-1.224.0518-2.4493.014-3.6732-.0028-.097.0414-.2356.13-.2062l-.1555-7.319 12.5354-2.0634c.4433.252.8525.5696 1.211.9412l-.2007 5.6022z"
												/>
												<path
													fill="#FF0"
													d="M34.0514 21.4676c-.3642.8707-.5738 1.8017-.8143 2.7188-.601 2.29-1.4044 4.5218-2.3967 6.658.1578.0357.3286.0014.4624-.0927.072.7567 1.0046 1.1686 1.678.8836.6734-.2846 1.071-1.0334 1.2235-1.777.0223-.1084.0407-.2198.0277-.33-.0202-.1737-.114-.3265-.1996-.477-.6817-1.2056-.9025-2.6877-.6033-4.0528.099-.4518.2715-.9186.6318-1.1878.2046-.1536.452-.2293.6975-.2872.6156-.146 1.2512-.198 1.8812-.154l.33-1.1467c.054-.1864.108-.3773.0993-.572-.0212-.4554-.393-.8263-.8058-.9727-.412-.1463-.8604-.115-1.2947-.0823"
												/>
												<path
													fill="#F15A24"
													d="M12.322 21.7194c.061.3407.127.693.3168.977.3034.4517.85.6324 1.3573.785.3797.1136.7785.2284 1.165.141.2643-.0598.5012-.2104.725-.3697.61-.433 1.1792-.9615 1.5326-1.6395.3962-.7593.4926-1.684.2625-2.5148-.0912-.3294-.2458-.6615-.524-.843-.2292-.1494-.5564-.2205-.6293-.4927-.1057-.3946-1.938-.4537-2.25-.4202-.474.051-.939.1728-1.2797.5403-.9068.9784-.8953 2.613-.676 3.8366M24.194 19.0418c.0644.3482.1334.708.3344.998.3193.462.8963.6468 1.431.8023.4005.1164.8212.234 1.2286.1447.2793-.0614.529-.2154.7647-.3776.644-.443 1.244-.983 1.617-1.6756.4174-.776.5195-1.7205.2768-2.5694-.0964-.3366-.2596-.6762-.5526-.8614-.242-.1528-.587-.2255-.664-.5037-.1117-.4033-2.0443-.464-2.3736-.4297-.4998.052-.9902.1766-1.3498.5523-.9564 1-.9442 2.67-.7126 3.9202"
												/>
												<path
													fill="#CCC"
													d="M35.9408 20.9708c.222.0064.4462.0053.6533.066.4068.1196.9188.5786.945-.1845.007-.1902.012-.3904-.0708-.56-.122-.251-.5983-.9602-.824-1.087-.1087-.061-.236-.0694-.359-.073-.3063-.0092-.613.0014-.9182.0315-.9906.0986-.7374 1.4513.01 1.725.177.0647.3693.0764.5638.082"
												/>
												<path
													fill="#FF7BAC"
													d="M37.8215 19.8532c-.0306.0467-.0694.0968-.123.099-.0946.0034-.1258-.128-.1816-.2085-.0644-.0938-.1824-.1258-.29-.1506-.4784-.112-1.163-.1415-1.5974-.3738-.4688-.251-.4095-.3117-.2434-.8975.178-.6268.4606-1.3722 1.071-1.6617 2.0532-.9728 2.1506 1.9814 1.3643 3.1932"
												/>
												<path
													fill="#FF0"
													d="M30.808 32.959c.0077.0694.0343.1556.1004.1593-.0834-.0335-.1158.1122-.095.203.429.0508.8583.1012 1.2877.152.263.0313.5674.0482.752-.151.1304-.141.16-.3512.1825-.5462.032-.274.064-.548.0964-.822.0082-.0724.0135-.1552-.0336-.2086-.034-.0388-.087-.051-.137-.0588-.219-.0327-.446-.0064-.6532.075-.6713.2642-.6634-.6747-1.1966-.4688-.4516.1747-.346 1.279-.3035 1.6663"
												/>
												<path
													fill="#FFF"
													d="M31.9858 34.3613c.3538.146.738.196 1.1182.2014 2.1213.03 4.1668-1.396 5.0646-3.4086.8978-2.0117.661-4.4994-.4998-6.3584-.514-.8238-1.3235-1.5857-2.2608-1.5168-.594.0433-1.1344.429-1.4745.9404-.3405.5112-.499 1.1347-.552 1.7558-.1233 1.4442.3143 2.9324 1.1923 4.053"
												/>
												<path
													fill="#F7E1CB"
													d="M11.2195 30.4984l9.4083-2.7606 1.318 7.9058-7.4904 2.7607"
												/>
												<path
													fill="#FFF"
													d="M12.7516 37.7683c.2136.2304.5864.1393.8525-.0207 1.096-.6588 1.5454-2.1516 1.337-3.4564-.108-.6758-.3805-1.3463-.877-1.792-.4966-.446-1.243-.6212-1.827-.3125-.402.212-.682.6167-.8776 1.041-.4437.9637-.5192 2.107-.206 3.1258.1683.548.462 1.0782.9255 1.388.4637.3095 1.1184.3464 1.543-.0195"
												/>
												<g>
													<path
														stroke="#000"
														strokeLinecap="round"
														strokeLinejoin="round"
														d="M27.37 11.0563c-2.068-.6386-4.2747-.727-6.4318-.54-2.669.2313-5.8933.8336-7.6967 2.1168-.6986.4972-3.0193 1.2145-3.5257 3.1977"
													/>
													<path
														fill="#FFF"
														d="M10.0543 14.9054c-1.561-.3985-3.317.0782-4.4594 1.2103-1.1422 1.132-1.726 2.906-1.237 4.4356.5752 1.8004 1.926 3.0712 2.306 3.275"
													/>
													<path
														stroke="#000"
														strokeLinecap="round"
														strokeLinejoin="round"
														d="M10.0543 14.9054c-1.561-.3985-3.317.0782-4.4594 1.2103-1.1422 1.132-1.7258 2.906-1.237 4.4356.5756 1.8004 1.926 3.0712 2.306 3.275"
													/>
													<path
														stroke="#000"
														strokeLinecap="round"
														strokeLinejoin="round"
														d="M11.823 29.9606c-2.7657-.9024-4.92-3.4455-5.3476-6.3126-.034-.2298.0103-.55.2428-.5677M33.1486 15.4973c.192.314.384.6286.576.9427.114.1872.2283.374.33.5677.5276 1.003.7084 2.182.5062 3.2958M35.8308 16.6844c-1.6376 4.9262-3.3644 9.8235-5.1785 14.688"
													/>
													<path
														stroke="#000"
														strokeLinecap="round"
														strokeLinejoin="round"
														d="M35.671 17.0804c.2263-.288.586-.4587.9517-.4895.366-.0313.736.0692 1.0563.2483.2708.1508.515.364.6543.6404.1393.276.161.6202.0118.8913M38.3983 17.8874c-.6142 1.9982-1.3304 3.9652-2.145 5.891"
													/>
													<path
														stroke="#000"
														strokeLinecap="round"
														strokeLinejoin="round"
														d="M37.245 21.08c.2485-.5347.1342-1.2158-.2747-1.641-.4093-.425-1.0872-.5678-1.6347-.3436-.1367.0562-.278.1512-.301.297"
													/>
													<path
														stroke="#000"
														strokeLinecap="round"
														strokeLinejoin="round"
														d="M37.2275 21.501c.0044-.5535-.3094-1.0984-.791-1.374-.482-.2753-1.113-.2705-1.5904.012"
													/>
													<path
														stroke="#000"
														strokeLinecap="round"
														strokeLinejoin="round"
														d="M34.2996 20.788c.7136-.389 1.6686-.2757 2.2706.269.2052.1856.376.4304.3964.706.006.0785-.0008.1578-.0196.2345M31.8127 33.921c.3626.1424.7564.1912 1.1458.1963 2.1737.0294 4.2697-1.3607 5.1896-3.3225.92-1.961.6773-4.386-.512-6.1982-.5268-.803-1.3562-1.5457-2.3166-1.4785-.6087.0423-1.1624.4184-1.511.9168-.3488.4983-.5113 1.106-.5655 1.7115-.1264 1.4077.322 2.8584 1.2216 3.9508M33.9912 29.3915l-1.467 4.0393M32.6352 33.0774c-.951.6286-1.8904 1.2738-2.8177 1.935"
													/>
													<path
														stroke="#000"
														strokeLinecap="round"
														strokeLinejoin="round"
														d="M30.6496 31.0486l-.6455 4.1743c-.0058.0366-.0053.083.0385.099.044.0162.0833-.0547.0346-.0517"
													/>
													<path
														stroke="#000"
														strokeLinecap="round"
														strokeLinejoin="round"
														d="M30.1422 33.367c.1982-.3278.4635-.6147.7748-.8386.078.1534.1257.3226.139.4943.287-.1218.5986-.183.9103-.1802-.3703.3692-.701.778-.9844 1.2173"
													/>
													<path
														stroke="#000"
														strokeLinecap="round"
														strokeLinejoin="round"
														d="M31.195 33.0817c-.389.5013-.7464 1.0268-1.0695 1.5725.0302-.0257.0604-.0514.0902-.0775M30.7412 32.969c.0104.3634-.12.7275-.3766 1.0607M32.6658 33.0168c.1094-.676.1787-1.3585.2074-2.0422-.326.1956-.6525.3912-.979.5872-.1045.0627-.2386.1262-.3414.06-.063-.04-.091-.1166-.1135-.1874-.133-.4158-.2417-.8396-.3253-1.2682-.291.3247-.547.6807-.7626 1.0594"
													/>
													<path
														stroke="#000"
														strokeLinecap="round"
														strokeLinejoin="round"
														d="M33.4372 28.176c-.177.4906-.354.9812-.5313 1.472-.285.7874-.5726 1.5822-1.0206 2.291M36.2456 21.1264c.048-.0176.0608-.0917.0218-.1244-.3043.6815-.5497 1.3883-.732 2.1112M30.4806 30.95c-.0843.2098-.1095.43-.074.6453M32.6366 25.235c-1.3602 1.8225-3.2855 3.1704-5.3524 4.1286-2.0672.958-4.284 1.55-6.5023 2.0763M30.348 27.747c.454.2455.8732.5552 1.24.9174M31.3832 34.1252c.6447 1.895.9225 3.913.8134 5.9105"
													/>
													<path
														stroke="#000"
														strokeLinecap="round"
														strokeLinejoin="round"
														d="M20.2203 27.5033c.529 2.5225.9453 5.069 1.2474 7.6282.0048.042.0063.0925-.0276.1178-.0345.0253-.095-.029-.0603-.0536"
													/>
													<path
														stroke="#000"
														d="M21.462 35.1753c-2.4317 1.1842-4.9882 2.113-7.614 2.7662-.0714.0177-.1587.031-.208-.023-.0494-.0544.038-.1667.0828-.1083"
														strokeLinecap="round"
														strokeLinejoin="round"
													/>
													<path
														stroke="#000"
														d="M13.3965 36.9094l.6482 1.51c-.01-.0428-.0207-.086-.0312-.129"
														strokeLinecap="round"
														strokeLinejoin="round"
													/>
													<path
														stroke="#000"
														d="M12.104 37.242c.219.2246.601.1358.8735-.0202 1.123-.6422 1.5835-2.0972 1.3698-3.369-.111-.659-.3898-1.3124-.8986-1.747-.5087-.4348-1.2736-.6054-1.872-.3045-.4118.2066-.6988.601-.8992 1.0147-.4546.9394-.532 2.054-.211 3.047.1723.5342.4733 1.051.9482 1.353.4753.3016 1.1462.3376 1.5813-.019M10.6766 30.3595c-.0715-.0158-.065.1064-.022.1655l.7927 1.0914c.011.0154.0276.0326.0457.0264.018-.006.0015-.0418-.01-.0268M10.6893 30.2222c3.1114-1.025 6.255-1.953 9.425-2.782.0814.1758.1628.352.2443.5274"
														strokeLinecap="round"
														strokeLinejoin="round"
													/>
													<path
														stroke="#000"
														d="M17.6433 28.0588c-.2222-.2202-.246-.6037-.5073-.7755-.2244-.148-.522-.0737-.7792.0048-1.0368.3175-2.073.6346-3.11.952-.2287.07-.4843.163-.579.382-.1275.2944.111.6096.332.843M13.849 27.877c-.025-.1897.085-.3783.2402-.4906.1554-.1123.349-.1592.5393-.1816.302-.0364.678.0275.7848.3115M17.774 36.8926c-.1595-.0286-.2392.1064-.234.201.068 1.193.0596 2.3876-.0247 3.5806M27.3276 14.627c-1.155-.254-2.4348.1776-3.1982 1.0778-.763.9005-.975 2.23-.5294 3.3214.203.498.537.9487.9825 1.252.757.5157 1.7714.556 2.64.263.9157-.3095 1.7137-.983 2.115-1.8592.401-.8763.3797-1.9464-.108-2.7783-.4875-.8312-1.447-1.3828-2.412-1.3303"
														strokeLinecap="round"
														strokeLinejoin="round"
													/>
													<path
														stroke="#000"
														strokeWidth=".5"
														strokeLinecap="round"
														strokeLinejoin="round"
														d="M15.604 17.5287c-.993-.5754-2.3376-.3743-3.2093.371-.872.745-1.2777 1.9505-1.1753 3.0903.038.4224.1422.845.359 1.2103.4368.7372 1.309 1.1618 2.168 1.1684.8592.007 1.6937-.3673 2.346-.924.2724-.2316.518-.497.7086-.799.465-.738.5666-1.6924.2675-2.511-.2992-.8188-.993-1.485-1.8255-1.7524"
													/>
													<path
														stroke="#000"
														strokeLinecap="round"
														strokeLinejoin="round"
														d="M25.8734 23.061c.019.8443.036 1.706-.2144 2.513-.3128 1.0058-1.0497 1.8733-1.9936 2.347-.9442.4738-2.0827.547-3.0803.1982"
													/>
													<path
														fill="#000"
														d="M24.826 27.045c-.909 1.0263-2.4282 1.5463-3.7262 1.098-.325-.1124-.682-.385-.5983-.7172-.305-.1123-.6554.132-.9616.024-.1132-.0405-.2045-.124-.2882-.21-.507-.519-.8602-1.1846-1.0054-1.894 1.3742.2257 2.797.237 4.147-.1035.6403-.1614 1.2614-.404 1.8365-.7284.2493-.1406 1.482-1.2717 1.6324-1.2287.3404.0972-.014 1.6884-.081 1.9398-.1798.6673-.4952 1.3003-.9554 1.82"
													/>
													<path
														stroke="#000"
														strokeLinecap="round"
														strokeLinejoin="round"
														d="M24.826 27.045c-.909 1.0263-2.4282 1.5463-3.7262 1.098-.325-.1124-.682-.385-.5983-.7172-.305-.1123-.6554.132-.9616.024-.1132-.0405-.2045-.124-.2882-.21-.507-.519-.8602-1.1846-1.0054-1.894 1.3742.2257 2.797.237 4.147-.1035.6403-.1614 1.2614-.404 1.8365-.7284.2493-.1406 1.482-1.2717 1.6324-1.2287.3404.0972-.014 1.6884-.081 1.9398-.1798.6673-.4952 1.3003-.9554 1.82z"
													/>
													<path
														fill="#FFF"
														d="M27.1593 11.0486c.356-.539.901-.9515 1.5182-1.148.3725-.1184.7656-.1595 1.157-.1632 1.2186-.011 2.452.3553 3.4137 1.1013.9616.7464 1.63 1.8822 1.7275 3.0925l.0405 1.2437c.0792.8083-.1735 1.644-.687 2.274-.0244.03-.0506.0716-.0296.1038.021.0323.0833-.0212.0465-.033"
													/>
													<path
														stroke="#000"
														strokeLinecap="round"
														strokeLinejoin="round"
														d="M27.1593 11.0486c.356-.539.901-.9515 1.5182-1.148.3725-.1184.7656-.1595 1.157-.1632 1.2186-.011 2.452.3553 3.4137 1.1013.9616.7464 1.63 1.8822 1.7275 3.0925l.0405 1.2437c.0792.8083-.1735 1.644-.687 2.274-.0244.03-.0506.0716-.0296.1038.021.0323.0833-.0212.0465-.033M19.0092 10.923c-.1602-.079-.1772-.2954-.172-.4733.078-2.7703.1672-5.5993 1.1384-8.1964 1.835.0793 3.6632.3303 5.4515.7494"
													/>
													<path
														fill="#FFF"
														d="M24.8624 3.1944c-.9362 1.032-.8485 2.7633.0626 3.8172.9108 1.0536 2.4758 1.4224 3.826 1.0687.64-.1677 1.2505-.4896 1.6915-.981 1.0054-1.121.9137-2.9152.1555-4.215-.237-.407-.534-.784-.9052-1.075-.72-.5643-1.7132-.7643-2.597-.5235-.883.241-1.6355.917-1.9667 1.768"
													/>
													<path
														stroke="#000"
														strokeLinecap="round"
														strokeLinejoin="round"
														d="M24.8624 3.1944c-.9362 1.032-.8485 2.7633.0626 3.8172.9108 1.0536 2.4758 1.4224 3.826 1.0687.64-.1677 1.2505-.4896 1.6915-.981 1.0054-1.121.9137-2.9152.1555-4.215-.237-.407-.534-.784-.9052-1.075-.72-.5643-1.7132-.7643-2.597-.5235-.883.241-1.6355.917-1.9667 1.768"
													/>
												</g>
											</g>
										</svg>
										<span style={{ verticalAlign: 'inherit' }}>
											<span style={{ verticalAlign: 'inherit' }}>发布到Reddit2</span>
										</span>
									</div>
									<ol>
										<li>
											<span>
												<span>记住人类</span>
											</span>
										</li>
										<li>
											<span>
												<span>像你在现实生活中那样表现</span>
											</span>
										</li>
										<li>
											<span>
												<span>寻找原始内容来源</span>
											</span>
										</li>
										<li>
											<span>
												<span>在发布之前搜索重复项</span>
											</span>
										</li>
										<li>
											<span>
												<span>阅读社区规则</span>
											</span>
										</li>
									</ol>
								</div>
							</div>
						}
						style={{
							margin: '0 2em 0',
							width: 'calc(100% - 4em)'
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
