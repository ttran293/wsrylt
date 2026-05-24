/**
 * Import all models so Mongoose registers schemas before populate() runs.
 */
import "./User";
import "./MusicPost";
import "./Comment";
import "./Like";

export { User } from "./User";
export { MusicPost } from "./MusicPost";
export { Comment } from "./Comment";
export { Like } from "./Like";
