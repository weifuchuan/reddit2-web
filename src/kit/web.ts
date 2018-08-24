import {
	LoginReq,
	LoginResp,
	Resp,
	RegReq,
	RegResp,
	ConfirmEmailReq,
	code,
	CreatePostResp,
	CreatePostReq,
	GetCommunitiesInfoResp,
	GetUserInfoResp,
	FeelPostReq
} from '../common/api';
import db from 'localforage';
import { RefreshTokenReq, RefreshTokenResp, AuthResp } from '../common/api';
import { User, Post, Comment } from '../model/index';
import { observable } from '../../node_modules/mobx';
import { Community } from 'src/model/index';
import { GetUserInfoReq, CommentPostReq } from '../common/api/index';
import { DeletePostReq } from '../common/api/post';
import { GetCommunitySubscriberCountReq, GetCommunitySubscriberCountResp } from '../common/api/community';
import { GetSubscribedCommunitiesReq, GetSubscribedCommunitiesResp } from '../common/api/user';
import {
	MediaUploadResp,
	GetPostByIdsReq,
	GetPostByIdsResp,
	GetAllPostByNewReq,
	GetAllPostByNewResp
} from '../common/api/index';

const host = '/api';
const tokenKey = 'f9b3129d2';
const refreshTokenKey = 'd226a7eb';
const idKey = 'b244566fa';

export const $ = {
	async json<T = any>(url: string, data: any, token: string = '', method: string = 'POST'): Promise<T> {
		const headers = new Headers();
		headers.append('Content-Type', 'application/json');
		if (token) {
			headers.append('Authorization', `Bearer ${token}`);
		}
		const resp = await fetch(url, {
			method: method.toUpperCase(),
			body: JSON.stringify(data),
			headers
		});
		return await resp.json();
	},
	async authReq<T = any>(url: string, data: any, method: string = 'POST'): Promise<T> {
		const headers = new Headers();
		headers.append('Content-Type', 'application/json');
		const token = await db.getItem(tokenKey);
		if (!token) {
			throw 'no token';
		}
		headers.append('Authorization', `Bearer ${token}`);
		const body = JSON.stringify(data);
		let resp = await fetch(url, {
			method: method.toUpperCase(),
			body,
			headers
		});
		let json: Resp = await resp.json();
		if (json.code === code.noAuth) {
			await refreshToken();
			const headers = new Headers();
			headers.append('Content-Type', 'application/json');
			const token = await db.getItem(tokenKey);
			if (!token) {
				throw 'no token';
			}
			headers.append('Authorization', `Bearer ${token}`);
			resp = await fetch(url, {
				method: method.toUpperCase(),
				body,
				headers
			});
			return await resp.json();
		}
		return json as any;
	},
	async authUploadFiles(files: { [name: string]: File }): Promise<MediaUploadResp> {
		let data = new FormData();
		for (let name in files) {
			data.append(name, files[name]);
		}
		const headers = new Headers();
		const token = await db.getItem(tokenKey);
		if (!token) {
			throw 'no token';
		}
		headers.append('Authorization', `Bearer ${token}`);
		const resp = await fetch('/media/upload', {
			body: data,
			method: 'post',
			headers
		});
		let json: Resp = await resp.json();
		if (json.code === code.noAuth) {
			await refreshToken();
			const headers = new Headers();
			const token = await db.getItem(tokenKey);
			if (!token) {
				throw 'no token';
			}
			headers.append('Authorization', `Bearer ${token}`);
			const resp = await fetch('/media/upload', {
				body: data,
				method: 'post',
				headers
			});
			return (await resp.json()) as MediaUploadResp;
		}
		return json as any;
	}
};

export async function confirmEmail(email: string) {
	const resp = await $.json<Resp>(`${host}/confirm-email`, { email } as ConfirmEmailReq);
	if (resp.code === code.success) {
		return;
	} else {
		throw resp.msg!;
	}
}

export async function reg(username: string, email: string, password: string, _code: string): Promise<User> {
	const resp = await $.json<RegResp>(`${host}/reg`, { username, password, code: _code, email } as RegReq);
	if (resp.code === code.success) {
		authHelper(resp.token, resp.refreshToken, (resp.user as User)._id);
		return observable(resp.user);
	} else {
		throw resp.msg;
	}
}

export async function auth(): Promise<AuthResp> {
	let token = await db.getItem<string>(tokenKey);

	let resp: AuthResp;
	if (token) {
		resp = await $.json<AuthResp>(`${host}/auth`, {}, token);

		if (resp.code !== code.success) {
			await refreshToken();
			token = await db.getItem<string>(tokenKey);
			resp = await $.json<AuthResp>(`${host}/auth`, {}, token);
		}
	} else {
		await refreshToken();
		token = await db.getItem<string>(tokenKey);
		resp = await $.json<AuthResp>(`${host}/auth`, {}, token);
	}
	if (resp.code === code.success) {
		return resp;
	} else {
		throw resp.msg;
	}
}

async function refreshToken() {
	const id = await db.getItem<string>(idKey);
	const refreshToken = await db.getItem<string>(refreshTokenKey);
	if (!id || !refreshToken) {
		throw 'no refresh token or id';
	}

	const { token } = await $.json<RefreshTokenResp>(`${host}/refresh-token`, {
		id,
		refreshToken
	} as RefreshTokenReq);

	await db.setItem(tokenKey, token);
}

async function authHelper(token: string, refreshToken: string, id: string) {
	try {
		await db.setItem(tokenKey, token);
		setTimeout(() => {
			db.removeItem(tokenKey);
		}, 1000 * 60 * 4.9);
		await db.setItem(idKey, id);
		await db.setItem(refreshTokenKey, refreshToken);
	} catch (e) {}
}

export async function login(loginer: string, password: string): Promise<User> {
	const req: LoginReq = { loginer, password };
	const resp = await $.json<LoginResp>(`${host}/login`, req);
	if (resp.code === code.success) {
		authHelper(resp.token, resp.refreshToken, (resp.user as User)._id);
		return observable(resp.user);
	} else {
		throw resp.msg;
	}
}

export async function getCommunitiesInfo(ids: string[]): Promise<Community[]> {
	if (ids.length === 0) return [];
	return (await $.json<GetCommunitiesInfoResp>(`${host}/community/get-infos`, { ids })).communities;
}

export async function createPost(
	title: string,
	content: string,
	kid: 'post' | 'imageOrVedio' | 'link',
	tags: string[],
	communityId?: string
): Promise<Post> {
	const req: CreatePostReq = { title, content, kid, tags, communityId, createAt: new Date().getTime() };
	const resp = await $.authReq<CreatePostResp>(`${host}/post/create`, req);
	if (resp.code === code.success) {
		const authorId = await db.getItem<string>(idKey);
		const post: Post = {
			_id: resp._id,
			slug: resp.slug,
			authorId,
			title,
			content,
			kid,
			tags,
			communityId,
			createAt: req.createAt,
			modifyAt: req.createAt,
			likeCount: 0,
			nayCount: 0,
			comments: []
		};
		return post;
	} else {
		throw resp.msg;
	}
}

export async function getPostsByIds(ids: string[], getterId?: string): Promise<GetPostByIdsResp> {
	const req: GetPostByIdsReq = { ids, getterId };
	const resp = await $.json<GetPostByIdsResp>(`${host}/post/get/ids`, req);
	return resp;
}

export async function getAllPostByNew(
	lastCreateAt?: number,
	count?: number,
	justId?: boolean, // default is false
	getterId?: string
): Promise<GetAllPostByNewResp> {
	const req: GetAllPostByNewReq = {};
	if (lastCreateAt) req.lastCreateAt = lastCreateAt;
	if (count) req.count = count;
	if (justId) req.justId = justId;
	if (getterId) req.getterId = getterId;
	const resp = await $.json<GetAllPostByNewResp>(`${host}/post/get/all/new`, req);
	return resp;
}

export async function getUserInfo(id: string): Promise<User> {
	const req: GetUserInfoReq = { id };
	const resp = await $.json<GetUserInfoResp>(`${host}/user/get-info`, req);
	if (resp.code === code.success) {
		return resp.user;
	} else {
		throw resp.msg;
	}
}

export async function feelPost(id: string, action: 'like' | 'nay' | 'soso'): Promise<void> {
	const req: FeelPostReq = { id, action };
	const resp = await $.authReq<Resp>(`${host}/post/feel`, req);
	if (resp.code === code.success) {
		return;
	} else {
		throw resp.msg;
	}
}

export async function logout() {
	await db.removeItem(tokenKey);
	$.json(`${host}/refresh-token/eject`, { refreshToken: await db.getItem<string>(refreshTokenKey) });
	await db.removeItem(refreshTokenKey);
	await db.removeItem(idKey);
	window.location.reload(true);
}

export async function commentPost(postId: string, comment: Comment, indexes: number[]): Promise<void> {
	const req: CommentPostReq = {
		postId,
		comment,
		indexes
	};
	const resp = await $.authReq(`${host}/post/comment`, req);
	if (resp.code === code.success) {
		return;
	} else {
		throw resp.msg;
	}
}

export async function deletePost(id: string): Promise<void> {
	const req: DeletePostReq = { id };
	const resp = await $.authReq<Resp>(`${host}/post/delete`, req);
	if (resp.code === code.success) {
		return;
	} else {
		throw resp.msg;
	}
}

export async function getSubscriberCount(ids: string[]): Promise<{ [id: string]: number }> {
	const req: GetCommunitySubscriberCountReq = { ids };
	const resp = await $.json<GetCommunitySubscriberCountResp>(`${host}/community/subscriber/count`, req);
	if (resp.code === code.success) {
		return resp.data;
	} else {
		throw resp.msg;
	}
}

export async function getSubscribedCommunityIds(userId: string): Promise<string[]> {
	const req: GetSubscribedCommunitiesReq = { userId };
	const resp = await $.json<GetSubscribedCommunitiesResp>(`${host}/user/subscribed-community`, req);
	if (resp.code === code.success) {
		return resp.communityIds;
	}
	throw resp.msg;
}
