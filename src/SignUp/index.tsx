import * as React from 'react';
import { observer, inject } from 'mobx-react';
import { Store } from '../store';
import bgimg from '../assets/image/login-reg-backgroud';
import { observable, action, runInAction } from 'mobx';
import { Input, AutoComplete, Button, message, Form, Checkbox, Icon } from 'antd';
import matchSorter from 'match-sorter';
import { $, confirmEmail, reg } from '../kit/web';
import md5 from 'js-md5';
import { FormComponentProps } from '../../node_modules/antd/lib/form';
import { SelectValue } from '../../node_modules/antd/lib/select';
import './index.scss'

const { Control } = require('react-keeper');

interface SignUpProps {
	store?: Store;
}

interface SelfState {
	stepIndex: number;
	email: string;
	emailDataSource: string[];
	nextingFromEmail: boolean;
	code: string;
	username: string;
	password: string;
	password2: string;
	registing: boolean;
	remember: boolean;
}

@inject('store')
@observer
export default class SignUp extends React.Component<SignUpProps> {
	@observable
	st: SelfState = {
		stepIndex: 0,
		email: '',
		emailDataSource: [],
		nextingFromEmail: false,
		code: '',
		username: '',
		password: '',
		password2: '',
		registing: false,
		remember: true
	};

	render() {
		return (
			<div className="SignUp">
				<div
					style={{
						backgroundImage: `url(${bgimg})`,
						height: '100%',
						width: '128px',
						backgroundSize: '100% 100%'
					}}
					className="hide-sm"
				/>
				<div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
					{
						[
							<div style={{ marginLeft: '1em',display: 'flex', flexDirection: 'column' }}>
								<h1 className={'Title'}>加入全球性会话</h1>
								<p className="Description">通过拥有Reddit2帐户，您可以订阅，投票和评论所有您喜欢的Reddit2内容。</p>
								<p className="Description">只需一分钟即可注册。</p>
								<AutoComplete
									allowClear={true}
									backfill={true}
									style={{ maxWidth: '34em' }}
									dataSource={this.st.emailDataSource.slice()}
									onSearch={this.onEmailSearch}
									onSelect={this.onEmailSelect}
									placeholder="输入邮箱"
								/>
								<Button
									type="primary"
									onClick={this.onNextFromEmail}
									style={{ width: '6em', marginTop: '16px' }}
									disabled={
										!/^[a-z0-9]+([._\\-]*[a-z0-9])*@([a-z0-9]+[-a-z0-9]*[a-z0-9]+.){1,63}[a-z0-9]+$/.test(
											this.st.email.trim()
										)
									}
									loading={this.st.nextingFromEmail}
								>
									下一步
								</Button>
								<div className="BottomText" style={{ display: 'block' }}>
									已经是Redditor？ <a onClick={() => Control.go('/login')}>登录</a>
								</div>
								<div className="BottomText">注册即表示您同意我们的条款，并且您已阅读我们的隐私政策和内容政策。</div>
							</div>,
							<div style={{ marginLeft: '1em' }}>
								<h1 className={'Title'}>
									验证码已发送至：{this.st.email}
									<a onClick={this.resendEmail}>&nbsp;重新发送</a>
								</h1>
								<p className="Description">(可能被服务器识别为“垃圾邮件”)</p>
								<RegForm
									onReg={(values: any) => {
										runInAction(() => {
											this.st.code = values.code;
											this.st.username = values.username;
											this.st.password = values.password;
											this.st.remember = values.remember;
										});
										this.onSignUp();
									}}
								/>
							</div>
						][this.st.stepIndex]
					}
				</div>
			</div>
		);
	}

	@action
	onEmailSelect = (e: SelectValue, option: Object) => {
		this.st.email = e.toString();
	};

	@action
	onEmailSearch = (e: string) => {
		this.st.email = e;
		const at = e.indexOf('@');
		if (-1 === at) {
			this.st.emailDataSource.splice(0, this.st.emailDataSource.length);
			this.st.emailDataSource.push(...emails.map((email) => e.trim() + email));
		} else {
			this.st.emailDataSource = matchSorter(emails.map((email) => e.trim().slice(0, at) + email), e);
		}
	};

	@action
	onNextFromEmail = async () => {
		this.st.nextingFromEmail = true;
		try {
			await confirmEmail(this.st.email);
			runInAction(() => {
				this.st.stepIndex++;
				this.st.nextingFromEmail = false;
			});
		} catch (e) {
			message.error(e.toString());
			runInAction(() => (this.st.nextingFromEmail = false));
		}
	};

	@action
	onSignUp = async () => {
		try {
			const user = await reg(this.st.username, this.st.email, md5(this.st.password), this.st.code);
			this.props.store!.setMe(user);
			Control.go('/');
		} catch (e) {
			message.error(e.toString());
		}
	};

	resendEmail = async () => {
		try {
			await confirmEmail(this.st.email);
			message.success('发送成功');
		} catch (e) {
			message.error(e.toString());
		}
	};
}

const FormItem = Form.Item;

class _RegForm extends React.Component<
	FormComponentProps & {
		onReg: (values: any) => void;
	}
> {
	handleSubmit = (e: any) => {
		e.preventDefault();
		this.props.form.validateFields((err, values) => {
			if (!err) {
				this.props.onReg(values);
			}
		});
	};

	render() {
		const { getFieldDecorator } = this.props.form;
		return (
			<Form onSubmit={this.handleSubmit} className="login-form" style={{ maxWidth: '34em' }}>
				<FormItem>
					{getFieldDecorator('code', {
						rules: [ { required: true, message: '请输入验证码（4位数字）', pattern: /^[0-9][0-9][0-9][0-9]$/ } ]
					})(<Input prefix={<Icon type="code" style={{ color: 'rgba(0,0,0,.25)' }} />} placeholder="验证码" />)}
				</FormItem>
				<FormItem>
					{getFieldDecorator('username', {
						rules: [
							{
								required: true,
								message: '请输入用户名（2-20位汉字、字母、数字）',
								pattern: /^[a-zA-Z0-9_\u4e00-\u9fa5]{2,20}$/
							}
						]
					})(<Input prefix={<Icon type="user" style={{ color: 'rgba(0,0,0,.25)' }} />} placeholder="用户名" />)}
				</FormItem>
				<FormItem>
					{getFieldDecorator('password', {
						rules: [
							{
								required: true,
								message: '请输入密码（6位以上字母数字组合）',
								pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/
							}
						]
					})(
						<Input
							prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />}
							type="password"
							placeholder="密码"
						/>
					)}
				</FormItem>
				<FormItem>
					{getFieldDecorator('password2', {
						rules: [
							{
								required: true,
								message: '请确认密码'
							},
							{
								validator: this.compareToFirstPassword
							}
						]
					})(
						<Input
							prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />}
							type="password"
							placeholder="确认密码"
						/>
					)}
				</FormItem>
				<FormItem>
					{getFieldDecorator('remember', {
						valuePropName: 'checked',
						initialValue: true
					})(<Checkbox>记住我</Checkbox>)}
					<Button type="primary" htmlType="submit" className="login-form-button">
						注册
					</Button>
				</FormItem>
			</Form>
		);
	}

	compareToFirstPassword = (rule: any, value: any, callback: any) => {
		const form = this.props.form;
		if (value && value !== form.getFieldValue('password')) {
			callback('两次密码不一致');
		} else {
			callback();
		}
	};
}

const RegForm = Form.create()(_RegForm);

const emails = [
	'@qq.com',
	'@163.com',
	'@126.com',
	'@sina.com',
	'@sohu.com',
	'@yahoo.cn',
	'@gmail.com',
	'@hotmail.com',
	'@live.cn',
	'@aliyun.com',
	'@vip.qq.com',
	'@msn.com'
];
