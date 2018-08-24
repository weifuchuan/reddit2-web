import * as React from 'react';

export default class Tabs extends React.Component<
	{
		style?: React.CSSProperties;
		tabs: {
			title: React.ReactNode;
			content: React.ReactNode;
		}[];
		onSelect?: (index: number) => void;
	},
	{
		curr: number;
	}
> {
	state = {
		curr: 0
	};

	render() {
		return (
			<div style={{ display: 'flex', flexDirection: 'column', ...this.props.style }}>
				<div style={{ display: 'flex', flexDirection: 'row' }}>
					{this.props.tabs.reduce(
						(prev, tab, i) => {
							const style: React.CSSProperties = {};
							if (this.state.curr === i) {
								style.borderBottom = '2px solid blue';
								style.color = 'blue';
							}
							prev.push(
								<div
									key={i}
									style={{
										flex: 1,
										display: 'flex',
										justifyContent: 'center',
										alignItems: 'center',
										padding: '1em 1em 0.5em 1em',
										...style
									}}
									onClick={() => {
										this.props.onSelect && this.props.onSelect(i);
										this.setState({ ...this.state, curr: i });
									}}
								>
									{tab.title}
								</div>
							);
							if (i !== this.props.tabs.length - 1)
								prev.push(<div key={i+"line"} style={{ width: '1px', backgroundColor: '#D3D3D3' }} />);
							return prev;
						},
						[] as React.ReactNode[]
					)}
				</div>
				<div>
					{this.props.tabs.map((tab, i) => {
						const style: React.CSSProperties = { display: i === this.state.curr ? 'block' : 'none' };
						return (
							<div
								key={i}
								style={{
									height: '100%',
									width: '100%',
									...style
								}}
							>
								{tab.content}
							</div>
						);
					})}
				</div>
			</div>
		);
	}
}
