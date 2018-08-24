import React from 'react';
import { Alert, Button } from 'antd';
const { Control } = require('react-keeper');

export default class C404 extends React.Component {
	render() {
		return (
			<div style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
				<Alert
					message="404 Not Found"
					description={
						<Button
							onClick={() => {
								Control.go(-1);
							}}
						>
							返回
						</Button>
					}
					type="warning"
					showIcon
				/>
			</div>
		);
	}
}
