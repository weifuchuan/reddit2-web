import * as React from 'react';
import './index.css';

interface Node {
	value: string;
	onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
	subNodes?: Node[];
}

export default class XiaoXiao extends React.Component<{ root: Node }> {
	render() {
		return (
			<div className="tree_node_list noselect">
				<NodeElement node={this.props.root} />
			</div>
		);
	}
}

class NodeElement extends React.Component<{ node: Node }, { hide: boolean }> {
	state = {
		hide: true
	};

	private onClick = (e: React.MouseEvent<HTMLDivElement>) => {
		this.props.node.onClick && this.props.node.onClick(e);
    this.setState({ hide: !this.state.hide });
    e.preventDefault();
    e.stopPropagation();
	};

	render() {
		return (
			<div onClick={this.onClick} className={`tree_node`}>
				<span className="category">{this.props.node.value}</span>
				{this.props.node.subNodes ? (
					<div className={`tree_node_list ${this.state.hide ? 'hide' : ''}`}>
						{this.props.node.subNodes!.map((node) => <NodeElement node={node} key={node.value} />)}
					</div>
				) : null}
			</div>
		);
	}
}
