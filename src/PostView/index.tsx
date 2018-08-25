import * as React from 'react';
import { Fragment } from 'react';
import { Post } from 'src/model';
import Card from './Card';
import { inject, observer } from 'mobx-react';
import FullScreenPost from './FullScreenPost';
import { observable, runInAction, action } from 'mobx';
import { List } from 'antd';
import { Store } from 'src/store';
import './index.scss'

interface Props {
	store?: Store;
	mode: 'card' | 'classic' | 'compact';
	posts: Post[];
	style?: React.CSSProperties;
	className?: string;
}

interface SelfState {
	currPost: Post | null;
}

@inject('store')
@observer
export default class PostView extends React.Component<Props> {
	@observable
	private st: SelfState = {
		currPost: null
	};

	render() {
		return (
			<Fragment>
				<div style={{ ...this.props.style, marginTop: '1em' }} className={this.props.className}>
					{this.props.mode === 'card' ? (
						<List
							dataSource={this.props.store!.posts.slice()}
							renderItem={(post: Post) => {
								return (
									<List.Item>
										<Card
											post={post}
											onClick={action(() => {
												this.st.currPost = post;
											})}
											onClickComment={action(() => {
												this.st.currPost = post;
											})}
										/>
									</List.Item>
								);
							}}
						/>
					) : this.props.mode === 'classic' ? (
						<div>未完成</div>
					) : (
						<div>未完成</div>
					)}
				</div>
				{this.st.currPost === null ? null : (
					<FullScreenPost
						post={this.st.currPost}
						onClose={() => runInAction(() => (this.st.currPost = null))}
						onClick={() => {
							/* unuseful */
						}}
					/>
				)}
			</Fragment>
		);
	}
}
