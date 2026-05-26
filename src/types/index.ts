export interface UserPublic {
  _id: string;
  name: string;
  email: string;
  information?: string;
  datejoin?: string;
}

export interface CommentPublic {
  _id: string;
  content: string;
  date: string;
  byUser: { _id: string; name: string };
}

export interface LikePublic {
  _id: string;
  byUser: { _id: string; name: string };
}

export interface PostPublic {
  _id: string;
  posturl: string;
  caption: string;
  tags: string[];
  date: string;
  creator: UserPublic;
  comments: CommentPublic[];
  likes: LikePublic[];
}

export interface TagCount {
  tag: string;
  count: number;
}

export interface SessionUser {
  userId: string;
  name: string;
  email: string;
}

export interface UserPostRef {
  _id: string;
  caption: string;
  posturl: string;
  creator: { _id: string; name: string };
}

export interface UserLikeEntry {
  _id: string;
  date: string;
  post: UserPostRef;
}

export interface UserCommentEntry {
  _id: string;
  content: string;
  date: string;
  post: UserPostRef;
}
