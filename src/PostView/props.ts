import { Store } from "src/store";
import { Post } from "../model";

export interface PostProps{
  store?:Store;
  post:Post; 
  onClick:()=>void; 
}