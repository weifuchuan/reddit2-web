import * as React from 'react';
import './index.scss';
import { Select } from 'antd';
import { ViewMode, SortMode } from '../kit/types';

interface Props {
	viewMode: ViewMode;
	onViewModeChange: (viewMode: ViewMode) => void;
	sort: string[];
	sortMode: SortMode;
	onSortChange: (order: SortMode) => void;
	style?: React.CSSProperties;
	className?: string;
}

export default class HelperBar extends React.Component<Props> {
	render() {
		return (
			<div className="HelperBar">
				<div className="ReactWidth">
					<div className="InnerBar">
						<span>VIEW</span>
						<div className="views">
							<button
								onClick={() => {
									this.props.onViewModeChange('card');
								}}
								aria-label="card"
								aria-pressed="true"
								id="layoutSwitch--card"
							>
								<svg
									style={{
										fill:
											this.props.viewMode === 'card'
												? 'rgb(0, 121, 211)'
												: 'rgba(0, 121, 211, 0.2)'
									}}
									viewBox="0 0 20 20"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										fill="inherit"
										d="M1.75,9.375 L1.75,1.75 L18.25,1.75 L18.25,9.375 L1.75,9.375 Z M1.75,18.25 L1.75,10.625 L18.25,10.625 L18.25,18.25 L1.75,18.25 Z"
									/>
								</svg>
							</button>
							<button
								onClick={() => {
									this.props.onViewModeChange('classic');
								}}
								aria-label="classic"
								aria-pressed="false"
								id="layoutSwitch--classic"
							>
								<svg
									style={{
										fill:
											this.props.viewMode === 'classic'
												? 'rgb(0, 121, 211)'
												: 'rgba(0, 121, 211, 0.2)'
									}}
									viewBox="0 0 20 20"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										fill="inherit"
										d="M1.75,6.60294118 L1.75,1.75 L18.25,1.75 L18.25,6.60294118 L1.75,6.60294118 Z M1.75,12.4264706 L1.75,7.57352941 L18.25,7.57352941 L18.25,12.4264706 L1.75,12.4264706 Z M1.75,18.25 L1.75,13.3970588 L18.25,13.3970588 L18.25,18.25 L1.75,18.25 Z"
									/>
								</svg>
							</button>
							<button
								onClick={() => {
									this.props.onViewModeChange('compact');
								}}
								aria-label="compact"
								aria-pressed="false"
								id="layoutSwitch--compact"
							>
								<svg
									style={{
										fill:
											this.props.viewMode === 'compact'
												? 'rgb(0, 121, 211)'
												: 'rgba(0, 121, 211, 0.2)'
									}}
									viewBox="0 0 20 20"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										fill="inherit"
										d="M1.75,4.95149254 L1.75,1.75 L18.25,1.75 L18.25,4.95149254 L1.75,4.95149254 Z M1.75,9.38432836 L1.75,6.18283582 L18.25,6.18283582 L18.25,9.38432836 L1.75,9.38432836 Z M1.75,18.25 L1.75,15.0485075 L18.25,15.0485075 L18.25,18.25 L1.75,18.25 Z M1.75,13.8171642 L1.75,10.6156716 L18.25,10.6156716 L18.25,13.8171642 L1.75,13.8171642 Z"
									/>
								</svg>
							</button>
						</div>
						<div
							style={{
								height: '20px',
								width: '1px',
								background: 'rgb(237, 239, 241)',
								margin: '0px 12px 0px 12px'
							}}
						/>
						<span>SORT</span>
						<div className="sorts">
							<Select
								dropdownMatchSelectWidth={false}
								value={this.props.sortMode}
								onSelect={(v) => {
									this.props.onSortChange(v.toString() as SortMode);
								}}
							>
								{this.props.sort.map((v) => {
									return (
										<Select.Option value={v} key={v}>
											{v}
										</Select.Option>
									);
								})}
							</Select>
						</div>
					</div>
				</div>
			</div>
		);
	}
}
