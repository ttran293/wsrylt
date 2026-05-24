export interface UserPublic {
  _id: string;
  name: string;
  email?: string;
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
  date: string;
  creator: UserPublic;
  comments: CommentPublic[];
  likes: LikePublic[];
}

export interface SessionUser {
  userId: string;
  name: string;
  email?: string;
}
