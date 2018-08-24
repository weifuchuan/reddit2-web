import * as React from 'react';
import './index.less';
import Content from './Content';

export interface Props {
	groups: {
		name: string;
		items: {
			key: string;
			icon: string;
			value: string;
		}[];
	}[];
	initItem?: { key: string; group: string };
	onClickItem: (key: string, value: string, group: string) => void;
}

export default class DropdownMenu extends React.Component<
	Props,
	{
		open: boolean;
		currItem: { group: string; key: string };
	}
> {
	div: HTMLDivElement | null = null;
	btn: HTMLButtonElement | null = null;
	constructor(props: Props) {
		super(props);
		this.state = {
			open: false,
			currItem: this.props.initItem
				? this.props.initItem
				: {
						group: this.props.groups[0].name,
						key: this.props.groups[0].items[0].key
					}
		};
	}

	render() {
		const item = this.props.groups.find((group) => group.name === this.state.currItem.group)!.items.find(
			(item) => item.key === this.state.currItem.key
		)!;
		return (
			<div className={'DropdownMenu'} ref={(r) => (this.div = r)}>
				<button onClick={this.openOrCloseDrop} ref={(r) => (this.btn = r)}>
					<span className="ButtonSpan">{item.key}</span>
					<img role="presentation" src={item.icon} />
					<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
						<g>
							<path
								fill="inherit"
								d="M14.1711599,9.3535 L9.99925636,13.529 L5.82735283,9.3535 C5.51262415,9.0385 5.73543207,8.5 6.18054835,8.5 L13.8179644,8.5 C14.2630807,8.5 14.4858886,9.0385 14.1711599,9.3535"
							/>
						</g>
					</svg>
				</button>
				{this.state.open ? <Content groups={this.props.groups} onClickItem={this.onClickItem} /> : null}
			</div>
		);
	}

	private onClickItem = (key: string, value: string, group: string) => {
		this.setState({ ...this.state, currItem: { key, group }, open: false });
		this.props.onClickItem(key, value, group);
	};

	private openOrCloseDrop = () => {
		this.setState({ ...this.state, open: !this.state.open });
	};

	private clickOtherElem = (e: any) => {
		if (!contains(this.div!, e.target) && this.state.open) {
			this.setState({ ...this.state, open: false });
		}
	};

	componentDidMount() {
		window.document.addEventListener('click', this.clickOtherElem);
	}

	componentWillUnmount() {
		window.document.removeEventListener('click', this.clickOtherElem);
	}
}

function contains(root: Element, target: Element): boolean {
	if (root === target) return true;
	let stack: Element[] = [ root ];
	for (let e = stack[stack.length - 1]; stack.length > 0; e = stack[stack.length - 1]) {
		stack = stack.slice(0, stack.length - 1);
		if (e === target) {
			return true;
		}
		for (let i = 0; i < e.children.length; i++) {
			if (e.children.item(i) === target) {
				return true;
			}	
			stack.push(e.children.item(i));
		}
	}
	return false;
}
