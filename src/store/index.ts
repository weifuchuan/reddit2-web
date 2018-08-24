import db from 'localforage';
import { action, configure, observable, computed, autorun, runInAction, toJS } from 'mobx';
import { Follow } from '../model/index';
import {
	getCommunitiesInfo,
	getAllPostByNew,
	getUserInfo,
	getSubscriberCount,
	getSubscribedCommunityIds
} from '../kit/web';
import { User, Post, Community, Interloper } from '../common/model/index';

(window as any).localforage = db;

export class Store {
	@observable private _me: User | null;

	get me(): User {
		return this._me!;
	}

	@action
	setMe(me: User | null) {
		this._me = me;
	}

	@computed
	get logged(): boolean {
		return this._me !== null;
	}

	@observable posts: Post[] = [];
	// private _myLikePosts: Set<string> = new Set();
	// get myLikePosts() {
	// 	return this._myLikePosts;
	// }
	// private _myNayPosts: Set<string> = new Set();
	// get myNayPosts() {
	// 	return this._myNayPosts;
	// }
	@observable myLikePosts = new Map<string, boolean>();
	@observable myNayPosts = new Map<string, boolean>();

	@observable communities: Community[] = [];
	@observable interlopers: Interloper[] = [];
	@observable follow: Follow[] = [];
	@observable users: User[] = [];

	@computed
	get id2Community(): Map<string, Community> {
		const map = new Map<string, Community>();
		for (const comm of this.communities) {
			map.set(comm._id, comm);
		}
		return map;
	}

	async getCommunities(ids: string[]): Promise<Community[]> {
		const comms: Community[] = [];
		const id2Community = this.id2Community;
		const notInLocalIds: string[] = [];
		for (const id of ids) {
			if (id2Community.has(id)) {
				comms.push(id2Community.get(id)!);
			} else {
				notInLocalIds.push(id);
			}
		}
		const comms2 = await getCommunitiesInfo(notInLocalIds);
		runInAction(() => {
			this.communities.push(...observable(comms2));
		});
		comms.push(...comms2);
		return comms;
	}

	@action
	addPost(post: Post) {
		this.posts.push(observable(post));
	}

	@action
	deletePost(id: string) {
		const i = this.posts.findIndex((p) => p._id === id);
		if (i === -1) return;
		this.posts.splice(i, 1);
	}

	async getUser(id: string): Promise<User> {
		if (this._me && this._me._id === id) {
			return this._me;
		}
		let i = this.users.findIndex((user) => user._id === id);
		if (i === -1) {
			const user = await getUserInfo(id);
			this.users.push(observable(user));
			return user;
		} else {
			return this.users[i];
		}
	}

	private trendingCommunities: Community[] = [];

	async getTrendingCommunities(): Promise<Community[]> {
		if (this.trendingCommunities.length > 0) return this.trendingCommunities;
		else {
			return [  ];
		}
	}

	private subscriberCount: Map<string, number> = new Map();
	async getSubscriberCount(ids: string[]): Promise<number[]> {
		const no: string[] = [];
		for (let id of ids) {
			if (!this.subscriberCount.has(id)) {
				no.push(id);
			}
		}
		const resp = await getSubscriberCount(ids);
		for (let id in resp) {
			this.subscriberCount.set(id, resp[id]);
		}
		return ids.map((id) => (this.subscriberCount.has(id) ? this.subscriberCount.get(id)! : 0));
	}

	private userToSubscribedCommunities: Map<string, Community[]> = new Map();
	async getSubscribedCommunities(userId: string): Promise<Community[]> {
		if (this.userToSubscribedCommunities.has(userId)) {
			return this.userToSubscribedCommunities.get(userId)!;
		} else {
			const cs = await this.getCommunities(await getSubscribedCommunityIds(userId));
			this.userToSubscribedCommunities.set(userId, cs);
			return cs;
		}
	}

	constructor() {
		this._me = null;

		autorun(async () => {
			if (this._me) {
				const ids = [];
				for (let id of this._me.subscribedCommunities) {
					if (-1 === this.communities.findIndex((community) => community._id === id)) {
						ids.push(id);
					}
				}
				const comms = await getCommunitiesInfo(ids);
				runInAction(() => {
					this.communities.push(...observable(comms));
				});
			}
		});

		const f: (g: any) => Promise<void> = async (g) => {
			if (this._me) {
				const resp = await getAllPostByNew(new Date().getTime(), 10, false, this.me._id);
				const posts: Post[] = resp.posts as Post[];
				runInAction(() => {
					(this.posts as any).clear();
					this.posts.push(...observable(posts));
					for (let id of resp.getterLikePosts!) {
						this.myLikePosts.set(id, true);
					}
					for (let id of resp.getterNayPosts!) {
						this.myNayPosts.set(id, true);
					}
					console.log(resp);
				});
			} else {
				setTimeout(() => {
					g(g);
				}, 100);
			}
		};
		f(f);
	}
}

const store = new Store();
(window as any).store = store;

export default store;
