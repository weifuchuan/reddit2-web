import * as React from 'react';
import './App.scss';
import { Provider, observer } from 'mobx-react';
import store from './store';
import bus from './bus';
import { auth } from './kit/web';
import { User } from './model';
import { observable } from 'mobx';
import C404 from './C404';
import 'video-react/dist/video-react.css';
const { HashRouter, Route, Control } = require('react-keeper');
const Router = HashRouter;

@observer
class App extends React.Component {
	render() {
		return (
			<Provider store={store} bus={bus}>
				<Router>
					<div
						style={{
							flex: 1,
							width: '100%',
							height: '100%'
						}}
						className="flex"
					>
						<Route
							index
							path={'/>'} 
							loadComponent={(cb: any) => import('./Home').then((Home) => cb(Home.default))}
							enterFilter={this.loggedFilterBuilder('/popular')}
						/>
						<Route
							path={'/all>'} 
							loadComponent={(cb: any) => import('./All').then((C) => cb(C.default))}
						/>
						<Route
							path={'/popular>'} 
							loadComponent={(cb: any) => import('./Popular').then((C) => cb(C.default))}
						/>
						<Route
							path={'/login>'}
							loadComponent={(cb: any) => import('./Login').then((Login) => cb(Login.default))}
							enterFilter={this.unloggedFilter}
						/>
						<Route
							path={'/sign-up>'}
							loadComponent={(cb: any) => import('./SignUp').then((SignUp) => cb(SignUp.default))}
							enterFilter={this.unloggedFilter}
						/>
						<Route
							path={'/c/:name>'}
							loadComponent={(cb: any) => import('./Community').then((Comm) => cb(Comm.default))} 
						/>
						<Route
							path={'/original>'}
							loadComponent={(cb: any) => import('./Original').then((C) => cb(C.default))} 
						/>
						<Route
							path={'/submit>'}
							loadComponent={(cb: any) => import('./Submit').then((C) => cb(C.default))}
							cache
							enterFilter={this.loggedFilterBuilder('/login')}
						/>
						<Route
							path="/user/:username>"
							cache
							loadComponent={(cb: any) => import('./User').then((C) => cb(C.default))}
						/>
						<Route
							path={"/user-settings"}
							cache
							loadComponent={(cb: any) => import('./UserSettings').then((C) => cb(C.default))}
							enterFilter={this.loggedFilterBuilder('/login')}
						/>
						<Route miss component={C404} />
					</div>
				</Router>
			</Provider>
		);
	}

	loggedFilterBuilder = (path: string) => (cb: () => void) => {
		const f = (f: any) => {
			if (this.authing !== 2) {
				setTimeout(() => {
					f(f);
				}, 100);
			} else {
				if (store.logged) {
					cb();
				} else {
					Control.go(path);
				}
			}
		};
		f(f);
	};

	unloggedFilter = (cb: () => void) => {
		const f = (f: any) => {
			if (this.authing !== 2) {
				setTimeout(() => {
					f(f);
				}, 100);
			} else {
				if (store.logged) {
					Control.go('/');
				} else {
					cb();
				}
			}
		};
		f(f);
	};

	authing: 0 | 1 | 2 = 0; // 0 init, 1 start, 2 end

	componentDidMount() {
		this.authing = 1;
		(async () => {
			try {
				const resp = await auth();
				const user: User = observable(resp.user);
				store.setMe(user);
			} catch (e) {
				console.error(e);
			}
			this.authing = 2;
		})();
	}
}

export default App;
