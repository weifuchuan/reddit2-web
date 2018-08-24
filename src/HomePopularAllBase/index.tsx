import * as React from 'react';
import { inject, observer } from 'mobx-react';
import { Store } from '../store/index';
import Frame from '../Frame/index';
import './index.scss';
import Container from '../Container';
import HelperBar from 'src/HelperBar';
import { observable, action } from 'mobx';
import { ViewMode, SortMode } from '../kit/types';
import PostView from '../PostView/index';
import { Button } from 'antd';
import { Community, Post } from 'src/model/index';
const { Control } = require('react-keeper');

interface Props {
	store?: Store;
	posts: Post[];
	pageName: string;
	pageProfile: string;
	sortMode: SortMode;
	sortModes:SortMode[]; 
	onSortChange: (m:SortMode)=>void; 
}

interface SelfState {
	viewMode: ViewMode;
}

@inject('store')
@observer
export default class HomePopularAllBase extends React.Component<Props> {
	@observable
	private st: SelfState = {
		viewMode: 'card'
	};

	@observable private trendingCommunities: Community[] = [];
	@observable private subscriberCountOfTrendingCommunities: number[] = [];
	@observable private subscribedCommunities: Community[] = [];

	render() {
		return (
			<Frame>
				<HelperBar
					viewMode={this.st.viewMode}
					sortMode={this.props.sortMode}
					sort={this.props.sortModes}
					onViewModeChange={action((vm: ViewMode) => {
						this.st.viewMode = vm;
					})}
					onSortChange={this.props.onSortChange}
				/>
				<Container
					main={<PostView posts={this.props.posts} mode={this.st.viewMode} />}
					lesser={
						<div className="Sider">
							<div>
								<div>
									<div
										style={{
											backgroundImage: `url(${require('../assets/image/home-banner@2x.png')})`
										}}
									/>
									<div>
										<div
											style={{
												backgroundImage: `url(${require('../assets/image/snoo-home@2x.png')})`
											}}
										/>
										<div>{this.props.pageName}</div>
									</div>
									<p>{this.props.pageProfile}</p>
									<Button
										style={{ width: '100%' }}
										type="primary"
										onClick={() => Control.go('/submit')}
									>
										创建帖子
									</Button>
								</div>
							</div>
							<div>
								<div>
									<div>
										<span>
											<span>趋势社区</span>
										</span>
									</div>
									<div>
										{this.trendingCommunities.map((c, i) => {
											return (
												<div key={c._id}>
													<div>
														<div>
															<div>
																<div>{c.name[0].toUpperCase()}</div>
															</div>
														</div>
														<div>
															<div>
																<a
																	onClick={() => Control.go(`/c/${c.name}`)}
																>{`c/${c.name}`}</a>
																<p>{`${this.subscriberCountOfTrendingCommunities[i]
																	? this.subscriberCountOfTrendingCommunities[i]
																	: 0} 订阅者`}</p>
															</div>
															<div>
																<Button
																	type={'primary'}
																	style={{ width: '100%' }}
																	onClick={() => this.subscribe(c._id)}
																>
																	{this.subscribedCommunities.find(
																		(sc) => sc._id === c._id
																	) ? (
																		'已订阅'
																	) : (
																		'订阅'
																	)}
																</Button>
															</div>
														</div>
													</div>
												</div>
											);
										})}
									</div>
								</div>
							</div>
							<div />
						</div>
					}
					className={'container ReactWidth'}
				/>
			</Frame>
		);
	}

	private subscribe = (id: string) => {};

	componentDidMount() {
		this.props.store!
			.getTrendingCommunities()
			.then((tcs) => {
				this.trendingCommunities = observable(tcs);
				return tcs.map((c) => c._id);
			})
			.then((cids) => {
				return this.props.store!.getSubscriberCount(cids);
			})
			.then((cnts) => {
				this.subscriberCountOfTrendingCommunities = observable(cnts);
			});
		this.props.store!
			.getSubscribedCommunities(this.props.store!.me._id)
			.then((cs) => (this.subscribedCommunities = observable(cs)));
	}
}
