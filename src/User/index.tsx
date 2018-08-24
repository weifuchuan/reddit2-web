import * as React from 'react';
import { inject, observer } from 'mobx-react';
import { Store } from '../store/index';
import Frame from '../Frame/index';
import Container from 'src/Container';
import { Community } from '../model/index';
const { Route, Control } = require('react-keeper');

interface Props {
	store?: Store;
	params: { username: string };
}
(window as any).Control = Control;
@inject('store', 'bus')
@observer
export default class User extends React.Component<Props> {
	render() {
		return (
			<Frame>
				<Container
					main={
						<div style={{ height: '200px', backgroundColor: '#abc123' }}>{this.props.params.username}</div>
					}
					lesser={<div style={{ height: '200px', backgroundColor: '#7876bb' }} />}
					className={'container ReactWidth'}
				/>
			</Frame>
		);
	}
}
