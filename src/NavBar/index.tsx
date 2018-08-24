import * as React from 'react';
import './index.scss';
import DropdownMenu from 'src/DropdownMenu';
import { Input, Button, Tooltip, Badge, Avatar, Popover, Icon } from 'antd';
import { observer, inject } from 'mobx-react';
import { observable, toJS } from 'mobx';
import { Store } from 'src/store';
import { Bus } from 'src/bus';
import { logout } from 'src/kit/web';
const Search = Input.Search;
const { Control } = require('react-keeper');

interface Props {
	store?: Store;
	bus?: Bus;
}

interface SelfState {
	searchText: string;
	groups: {
		name: string;
		items: {
			key: string;
			value: string;
			icon: string;
		}[];
	}[];
	chatNotify: boolean;
}

@inject('store', 'bus')
@observer
export default class NavBar extends React.Component<Props> {
	@observable
	private st: SelfState = {
		searchText: '',
		groups: [
			{
				name: 'Reddit2 动态',
				items: [
					{
						key: '流行',
						value: 'popular',
						icon: require('../assets/image/popular.png')
					},
					{
						key: '所有',
						value: 'all',
						icon: require('../assets/image/all.png')
					},
					{
						key: '原创内容',
						value: 'original',
						icon: require('../assets/image/oc.png')
					}
				]
			},
			{
				name: '我的订阅',
				items: []
			},
			{
				name: '关注的人',
				items: []
			}
		],
		chatNotify: false
	};

	render() {
		const store = this.props.store!;
		let groups = toJS(this.st.groups);
		if (store.logged) {
			groups[0].items = [
				{
					key: '首页',
					value: 'home',
					icon: store.me.headImg
				},
				...groups[0].items
			];
		}
		const path: string = Control.path;

		return (
			<div className="Nav">
				<img className="Logo" src={require('../assets/image/youlin.png')} onClick={() => Control.go('/')} />
				<img className="LogoName" src={require('../assets/image/name.png')} onClick={() => Control.go('/')} />
				<DropdownMenu groups={groups} onClickItem={this.onClickCommunity} />
				<Search
					placeholder="搜索"
					onSearch={(value) => (this.st.searchText = value)}
					style={{ flex: 1, marginLeft: '1em', marginRight: '1em' }}
				/>
				<div className="IconBtns">
					<div>
						<Tooltip placement="bottom" title={<span>popular</span>}>
							<a onClick={() => this.onClickCommunity('流行', 'popular', 'Reddit2 动态')}>
								<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
									<g>
										<polygon fill="none" points="0 20 20 20 20 0 0 0" />
										<polygon
											fill="inherit"
											points="12.5 3.5 20 3.5 20 11 17.5 8.5 11.25 14.75 7.5 11 2.5 16 0 13.5 7.5 6 11.25 9.75 15 6"
										/>
									</g>
								</svg>
							</a>
						</Tooltip>
						<Tooltip placement="bottom" title={<span>all</span>}>
							<a onClick={() => this.onClickCommunity('全部', 'all', 'Reddit2 动态')}>
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
									<g fillRule="evenodd">
										<polygon fill="none" points="0 20 20 20 20 .001 0 .001" />
										<path
											fill="inherit"
											d="M1.25,17.5 L1.25,7.5 L6.25,7.5 L6.25,17.5 L1.25,17.5 Z M12.49995,17.5001 L7.49995,17.5001 L7.49995,5.0001 L4.99995,5.0001 L9.99995,0.0006 L14.99995,5.0001 L12.49995,5.0001 L12.49995,17.5001 Z M13.75,17.5 L13.75,12.5 L18.75,12.5 L18.75,17.5 L13.75,17.5 Z"
										/>
									</g>
								</svg>
							</a>
						</Tooltip>
						<Tooltip placement="bottom" title={<span>original content</span>}>
							<a onClick={() => this.onClickCommunity('原创', 'original', 'Reddit2 动态')}>
								<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
									<path
										fill="inherit"
										d="M16.9998,2.9995 C18.1028,2.9995 18.9998,3.8975 18.9998,4.9995 L18.9998,14.9995 C18.9998,16.1025 18.1028,16.9995 16.9998,16.9995 L2.9998,16.9995 C1.8978,16.9995 0.9998,16.1025 0.9998,14.9995 L0.9998,4.9995 C0.9998,3.8975 1.8978,2.9995 2.9998,2.9995 L16.9998,2.9995 Z M13.9648,13.3525 C15.2718,13.3525 16.3188,12.6745 16.8278,11.5665 L15.1818,10.9775 C14.9318,11.4765 14.4528,11.8165 13.8338,11.8165 C13.0158,11.8165 12.3478,11.0575 12.3478,9.9995 C12.3478,8.9525 13.0058,8.1735 13.8438,8.1735 C14.4528,8.1735 14.9218,8.5025 15.1308,8.9615 L16.6968,8.2435 C16.1988,7.2755 15.2108,6.6365 13.9648,6.6365 C12.0588,6.6365 10.5118,8.1335 10.5118,9.9995 C10.5118,11.8755 12.0588,13.3525 13.9648,13.3525 Z M6.6248,13.3635 C8.5408,13.3635 10.0878,11.8755 10.0878,9.9995 C10.0878,8.1335 8.5408,6.6365 6.6248,6.6365 C4.7188,6.6365 3.1718,8.1335 3.1718,9.9995 C3.1718,11.8755 4.7188,13.3635 6.6248,13.3635 Z M6.625,8.1641 C7.562,8.1641 8.262,8.9421 8.262,10.0001 C8.262,11.0481 7.562,11.8361 6.625,11.8361 C5.697,11.8361 4.998,11.0481 4.998,10.0001 C4.998,8.9421 5.697,8.1641 6.625,8.1641 Z"
									/>
								</svg>
							</a>
						</Tooltip>
					</div>
				</div>
				{store.logged ? (
					<React.Fragment>
						<div className="loggedBtnsOfNavbar">
							<span>
								<Tooltip placement="bottom" title={<span>chat</span>}>
									<Badge
										count={this.st.chatNotify ? 1 : 0}
										dot={true}
										style={{
											top: '0.3em',
											right: '0',
											height: '6px',
											width: '6px'
										}}
									>
										<a onClick={this.onChatBtnClick}>
											<svg viewBox="0 0 25 25" xmlns="http://www.w3.org/2000/svg">
												<g>
													<path d="M18.5 13.17a1.62 1.62 0 0 1-2.35 0c-.31-.3-.48-.73-.48-1.17 0-.44.17-.87.49-1.17a1.7 1.7 0 0 1 2.35 0c.32.3.49.73.49 1.17 0 .44-.17.87-.5 1.17m-4.86-.85c-.03.1-.05.21-.1.32l-.15.28c-.07.1-.14.19-.22.25a1.62 1.62 0 0 1-2.35 0 1.85 1.85 0 0 1-.36-.53c-.05-.1-.07-.21-.1-.32-.01-.1-.03-.21-.03-.32 0-.44.18-.87.5-1.17a1.7 1.7 0 0 1 2.34 0c.32.3.5.73.5 1.17l-.03.32m-5.33 0c-.03.1-.06.21-.11.32-.04.1-.1.2-.15.28-.06.1-.13.19-.21.27a1.67 1.67 0 0 1-2.35 0c-.08-.08-.14-.18-.21-.27a1.85 1.85 0 0 1-.25-.6 1.62 1.62 0 0 1 .47-1.5 1.7 1.7 0 0 1 2.34 0 1.85 1.85 0 0 1 .47.85l.02.33-.02.32M12 0A12.01 12.01 0 0 0 1.99 18.6L.7 22.46a.67.67 0 0 0 .84.84L5.4 22A12.01 12.01 0 0 0 24 12c0-6.62-5.38-12-12-12" />
													<path
														d="M18.5 13.17a1.62 1.62 0 0 1-2.35 0c-.31-.3-.48-.73-.48-1.17 0-.44.17-.87.49-1.17a1.7 1.7 0 0 1 2.35 0c.32.3.49.73.49 1.17 0 .44-.17.87-.5 1.17"
														fill="transparent"
													/>
													<path
														d="M13.64 12.32c-.03.1-.05.21-.1.32l-.15.28c-.07.1-.14.19-.22.25a1.62 1.62 0 0 1-2.35 0 1.85 1.85 0 0 1-.36-.53c-.05-.1-.07-.21-.1-.32-.01-.1-.03-.21-.03-.32 0-.44.18-.87.5-1.17a1.7 1.7 0 0 1 2.34 0c.32.3.5.73.5 1.17l-.03.32"
														fill="transparent"
													/>
													<path
														d="M8.3 12.32a1.85 1.85 0 0 1-.25.6c-.06.1-.13.19-.21.27a1.67 1.67 0 0 1-2.35 0c-.08-.08-.14-.18-.21-.27a1.85 1.85 0 0 1-.25-.6 1.62 1.62 0 0 1 .47-1.5 1.7 1.7 0 0 1 2.34 0 1.85 1.85 0 0 1 .47.85l.02.33-.02.32"
														fill="transparent"
													/>
												</g>
											</svg>
										</a>
									</Badge>
								</Tooltip>
							</span>
							<span>
								<Tooltip placement="bottom" title={<span>messages</span>}>
									<a onClick={this.onMessagesBtnClick}>
										<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
											<path d="M8.10849995,9.1565 L2.79999995,3.848 C3.17249995,3.6285 3.60499995,3.5 4.06849995,3.5 L16.5685,3.5 C17.0315,3.5 17.464,3.6285 17.8365,3.848 L12.528,9.1565 C11.31,10.375 9.32699995,10.375 8.10849995,9.1565 Z M13.1435,10.3085 L18.452,5 C18.6715,5.3725 18.8,5.805 18.8,6.2685 L18.8,13.7685 C18.8,15.149 17.6805,16.2685 16.3,16.2685 L3.79999995,16.2685 C2.41899995,16.2685 1.29999995,15.149 1.29999995,13.7685 L1.29999995,6.2685 C1.29999995,5.805 1.42849995,5.3725 1.64799995,5 L6.95649995,10.3085 C7.80949995,11.1615 8.92949995,11.588 10.05,11.588 C11.17,11.588 12.2905,11.1615 13.1435,10.3085 Z" />
										</svg>
									</a>
								</Tooltip>
							</span>
							<span>
								<Tooltip placement="bottom" title={<span>new post</span>}>
									<button onClick={this.onEditBtnClick}>
										<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
											<path d="M5,15 C4.448,15 4,14.553 4,14 L4,11.172 C4,10.906 4.105,10.652 4.293,10.465 L12.379,2.379 C12.77,1.988 13.402,1.988 13.793,2.379 L16.621,5.207 C17.012,5.598 17.012,6.23 16.621,6.621 L8.536,14.707 C8.348,14.895 8.094,15 7.829,15 L5,15 Z M17,16 C17.552,16 18,16.447 18,17 C18,17.553 17.552,18 17,18 L3,18 C2.448,18 2,17.553 2,17 C2,16.447 2.448,16 3,16 L17,16 Z" />
											<g fill="none">
												<polygon points="0 20 20 20 20 0 0 0" />
												<use />
											</g>
										</svg>
									</button>
								</Tooltip>
							</span>
						</div>
						<Popover
							placement="bottomRight"
							content={
								<div className="UserPopoverContent">
									<button onClick={() => Control.go(`/user/${this.props.store!.me.username}`)}>
										<Icon type="user" />
										<span>My Profile</span>
									</button>
									<button onClick={() => Control.go(`/user-settings`)}>
										<Icon type="setting" />
										<span>User Settings</span>
									</button>
									<button onClick={async () => await logout()}>
										<Icon type="logout" />
										<span>Log Out</span>
									</button>
								</div>
							}
							trigger="click"
						>
							<button className={'User'}>
								<Avatar shape="square" src={this.props.store!.me.headImg} size="small" />
								<span className="UserName">{this.props.store!.me.username}</span>
								<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
									<g>
										<path
											fill="inherit"
											d="M14.1711599,9.3535 L9.99925636,13.529 L5.82735283,9.3535 C5.51262415,9.0385 5.73543207,8.5 6.18054835,8.5 L13.8179644,8.5 C14.2630807,8.5 14.4858886,9.0385 14.1711599,9.3535"
										/>
									</g>
								</svg>
							</button>
						</Popover>
					</React.Fragment>
				) : (
					<React.Fragment>
						<Button onClick={() => Control.go('/login')}>登录</Button>
						<Button onClick={() => Control.go('/sign-up')} style={{ marginLeft: '1em' }} type="primary">
							注册
						</Button>
					</React.Fragment>
				)}
			</div>
		);
	}

	private onClickCommunity = (key: string, value: string, group: string) => {
		if (group === 'Reddit2 动态' || group === '我的订阅') {
			// this.props.bus!.clearCommunityCache();
			if (value === 'original') {
				Control.go(`/original`);
			} else if (value === 'all') {
				Control.go(`/all`);
			} else if (value === 'popular') {
				Control.go(`/popular`);
			} else if (value === 'home') {
				Control.go(`/`);
			} else {
				Control.go(`/c/${value}`);
			}
		} else if (group === '关注的人') {
		}
	};

	private onChatBtnClick = () => {};
	private onMessagesBtnClick = () => {};
	private onEditBtnClick = () => {
		Control.go('/submit');
	};
}
