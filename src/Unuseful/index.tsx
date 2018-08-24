import * as React from 'react';

export default class Unuseful extends React.Component<
	{
	},
	{
		color: string;
		current: number;
	}
> {
	state = {
		color: '#ffffff',
		current: 0
	};

	render() {
		return (
			<div>
				<input
					value={this.state.color}
					onInput={(e: any) => this.setState({ ...this.state, color: e.target.value })}
				/>
				<input
					value={this.state.current}
					type="number"
					onInput={(e: any) => this.setState({ ...this.state, current: Number.parseInt(e.target.value) })}
				/>
				{(this.props.children as React.ReactNode[]).map((step, index) => {
					if (index === this.state.current) {
						return <Step {...{ ...(step as Step).props, color: this.state.color }} />;
					}
					return step;
				})}
			</div>
		);
	}
}

export class Step extends React.Component<{ color: string }> {
	render() {
		return <div style={{ backgroundColor: this.props.color, width: '20px', height: '20px' }} />;
	}
}
