import * as React from 'react';
import './Content.less';
import matchSorter from 'match-sorter';

export interface Props {
	groups: {
		name: string;
		items: {
			key: string;
			value:string; 
			icon: string;
		}[];
	}[];
	onClickItem: (key: string,value:string, group: string) => void;
}

export default class Content extends React.PureComponent<Props, { filter: string }> {
	constructor(props: Props) {
		super(props);
		this.state = {
			filter: ''
		};
	}

	private onInputFilter = (e: React.FormEvent<HTMLInputElement>) => {
		this.setState({
			...this.state,
			filter: e.currentTarget.value.trim()
		});
	};

	render() {
		const items = this.props.groups.reduce(
			(prev, group) => [ ...prev, ...group.items.map((item) => ({ key: item.key, group: group.name })) ],
			[] as { key: string; group: string }[]
		);
		const result = matchSorter(items, this.state.filter, {
			keys: [ 'key' ]
		});
		const groups = this.props.groups.reduce(
			(prev, group) => {
				const gr = {
					...group,
					items: group.items.filter(
						(item) => result.findIndex((it) => it.key === item.key && group.name === it.group) !== -1
					)
				};
				if (gr.items.length > 0) {
					prev.push(gr);
				}
				return prev;
			},
			[] as {
				name: string;
				items: {
					key: string;
					value:string; 
					icon: string;
				}[];
			}[]
		);
		return (
			<div className="dm-content">
				<input placeholder="filter" onInput={this.onInputFilter} />
				{groups.map((group) => {
					return (
						<div key={group.name}>
							<div className="group-name">{group.name}</div>
							{group.items.map((item) => {
								return (
									<a
										className={'item'}
										key={group.name + '-' + item.key}
										onClick={() => {
											this.props.onClickItem(item.key,item.value,  group.name);
										}}
									>
										<img className={'icon'} src={item.icon} />
										<span className={'name'}>{item.key}</span>
									</a>
								);
							})}
						</div>
					);
				})}
			</div>
		);
	}
}
