import * as React from 'react';
import { inject, observer } from 'mobx-react';
import { Store } from '../store/index';
import Frame from '../Frame/index';
import { Community } from '../model/index';
const {Route, Control}=require("react-keeper")

interface Props {
	store?: Store;
}

@inject('store')
@observer
export default class Original extends React.Component {
	render() {
		return (
			<Frame>
				
			</Frame>
		);
	}

}
