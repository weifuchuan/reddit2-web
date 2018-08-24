import * as React from 'react';
import NavBar from 'src/NavBar';
import './index.scss';
import { inject } from 'mobx-react';
import { Bus } from 'src/bus';
const { Control } = require('react-keeper');

@inject('bus')
export default class Frame extends React.Component<
	{
		bus?: Bus;
	},
	{
		overflow: 'auto' | 'hidden';
	}
> {
	state = {
		overflow: 'auto' as 'auto'
	};

	render() {
		return (
			<div style={{ flex: 1 }}>
				<NavBar />
				<div className="FrameInner" style={{ overflow: this.state.overflow }}>
					{this.props.children}
				</div>
			</div>
		);
	}

	componentDidMount() {
		this.props.bus!.addListener('setFrameInnerContainerAutoOverflow', this.autoOverflow);
		this.props.bus!.addListener('setFrameInnerContainerHiddenOverflow', this.hiddenOverflow);
	}

	componentWillUnmount() {
		this.props.bus!.removeListener('setFrameInnerContainerAutoOverflow', this.autoOverflow);
		this.props.bus!.removeListener('setFrameInnerContainerHiddenOverflow', this.hiddenOverflow);
	}

	private autoOverflow = () => {
		window.document.getElementsByTagName("html")[0].setAttribute("style",  "overflow: auto"); 
	};

	private hiddenOverflow = () => {
		window.document.getElementsByTagName("html")[0].setAttribute("style",  "overflow: hidden"); 
	};
}
