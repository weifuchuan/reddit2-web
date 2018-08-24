import * as React from 'react'; 
import { PostProps } from './props';
import { inject, observer } from 'mobx-react';
import BasePostView from './BasePostView';

@inject("store")
@observer
export default class Classic extends BasePostView{
  render() {
    return (
      <div>
        
      </div>
    );
  }
}