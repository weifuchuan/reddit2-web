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
import { Community } from 'src/model/index';
import HomePopularAllBase from '../HomePopularAllBase';
const { Control } = require('react-keeper');

interface Props {
	store?: Store;
}

interface SelfState {
	viewMode: ViewMode;
	sortMode: SortMode;
}

@inject('store')
@observer
export default class Popular extends React.Component<Props> {
	@observable
	private st: SelfState = {
		viewMode: 'card',
		sortMode: 'best'
	};

	sortModes: SortMode[] = [ 'hot', 'new', 'controversial', 'top', 'rising' ];
	@observable sortMode: SortMode = 'hot';

	render() {
		const store = this.props.store!;
		return (
			<HomePopularAllBase
				posts={this.props.store!.posts}
				pageName={'流行'}
				pageProfile={'Reddit的最佳帖子，来自Reddit上最活跃的社区。在此处查看互联网上最常见，最受欢迎和评论的内容。'}
				sortMode={this.sortMode}
				sortModes={this.sortModes}
				onSortChange={(sm) => {
					this.sortMode = sm;
				}}
			/>
		);
	}

	componentDidMount() {}
}

/*

		return (
			<Frame>
				<HelperBar
					viewMode={this.st.viewMode}
					sort={[ 'best', 'hot', 'new', 'controversial', 'top', 'rising' ]}
					onViewModeChange={action((vm: ViewMode) => {
						this.st.viewMode = vm;
					})}
					onSortChange={action((sortMode: SortMode) => {
						this.st.sortMode = sortMode;
					})}
				/>
				<Container
					main={<PostView posts={store.posts} mode={this.st.viewMode} />}
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
										<div>首页</div>
									</div>
									<p>你的个人Reddit2首页。来这里浏览你最喜欢的社区。</p>
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

*/
