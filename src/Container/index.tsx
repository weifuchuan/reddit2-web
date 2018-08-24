import * as React from 'react';
import './index.scss';

export default (props: {
	main: React.ReactNode;
	lesser: React.ReactNode;
	style?: React.CSSProperties;
	className?: string;
}) => {
	return (
		<div style={props.style} className={`Container ${props.className ? props.className : ''}`}>
			<div className="Main">{props.main}</div>
			<div className="Lesser">{props.lesser}</div>
		</div>
	);
};
