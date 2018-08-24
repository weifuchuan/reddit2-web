import * as React from 'react'; 
import { PostProps } from './props';
import { inject, observer } from 'mobx-react';

@inject("store")
@observer
export default class Compact extends React.Component<PostProps>{
  render() {
    return (
      <div>
        
      </div>
    );
  }
}