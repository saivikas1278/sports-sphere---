import express from 'express';
import {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  likePost,
  addComment,
  getUserPosts,
  sharePost,
  savePost,
  reportPost
} from '../controllers/posts.js';
import { protect, optionalAuth } from '../middleware/auth.js';
import fileUpload from 'express-fileupload';

const router = express.Router();

// Configure file upload middleware
const fileUploadConfig = fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  },
  abortOnLimit: true
});

// Public routes
router.get('/', optionalAuth, getPosts);
router.get('/:id', optionalAuth, getPost);
router.get('/user/:userId', getUserPosts);

// Protected routes
router.use(protect);

router.post('/', fileUploadConfig, createPost);
router.put('/:id', updatePost);
router.delete('/:id', deletePost);
router.post('/:id/like', likePost);
router.post('/:id/comments', addComment);
router.post('/:id/share', sharePost);
router.post('/:id/save', savePost);
router.post('/:id/report', reportPost);

export default router;
