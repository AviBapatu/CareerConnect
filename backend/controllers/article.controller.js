import Article from "../models/Article.js";
import User from "../models/User.js";
import Company from "../models/Company.js";
import { AppError } from "../utils/AppError.js";
import { catchAndWrap } from "../utils/catchAndWrap.js";
import { articleOptions } from "../utils/queryOperations/articleOptions.js";
import {
  createArticleSchema,
  updateArticleSchema,
  getArticleSchema,
} from "../zodSchema/article.validation.js";

export const createArticle = async (req, res) => {
  const parsed = createArticleSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError("Validation failed", 400, parsed.error.errors);
  }

  //   req.log.info(parsed.data, req.user.id);

  const article = await catchAndWrap(
    () =>
      Article.create({
        ...parsed.data,
        authorType: req.user.company ? "Company" : "User",
        author: req.user.company ? req.user.company : req.user.id,
      }),
    "Failed to create article"
  );

  res.status(201).json(article);
};

export const getMyArticles = async (req, res) => {
  const authorId = req.user.company ? req.user.company : req.user._id;
  const articles = await catchAndWrap(
    () => Article.find({ author: authorId }).lean(),
    "Failed to fetch your articles"
  );

  res.status(200).json(articles);
};

export const getAllArticles = async (req, res) => {
  req.log.info("🐛 DEBUG - getAllArticles called with query:", req.query);

  const { filter, skip, limit, sort } = articleOptions(req.query);

  req.log.info("🐛 DEBUG - Processed query options:", {
    filter,
    skip,
    limit,
    sort,
  });

  const [articles, totalArticles] = await Promise.all([
    catchAndWrap(async () => {
      const articles = await Article.find(filter)
        .populate("comments.user", "name email")
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .lean();

      // Manually populate each article based on its authorType
      const populatedArticles = await Promise.all(
        articles.map(async (article) => {
          let populatedAuthor = null;

          req.log.info("🐛 DEBUG - Article authorType:", article.authorType);
          req.log.info("🐛 DEBUG - Article author ID:", article.author);

          if (article.authorType === "User" || article.authorType === "user") {
            populatedAuthor = await User.findById(article.author)
              .select("name email")
              .lean();
            req.log.info("🐛 DEBUG - Found User author:", populatedAuthor);
          } else if (
            article.authorType === "Company" ||
            article.authorType === "company"
          ) {
            populatedAuthor = await Company.findById(article.author)
              .select("name email")
              .lean();
            req.log.info("🐛 DEBUG - Found Company author:", populatedAuthor);
          }

          // Add populated author
          article.author = populatedAuthor;

          req.log.info("🐛 DEBUG - Final article with author:", {
            title: article.title,
            authorType: article.authorType,
            author: article.author,
          });

          return article;
        })
      );

      return populatedArticles;
    }, "Failed to fetch articles"),
    catchAndWrap(
      () => Article.countDocuments(filter),
      "Failed to count articles"
    ),
  ]);

  req.log.info("🐛 DEBUG - Found articles:", articles.length);
  req.log.info("🐛 DEBUG - Total articles matching filter:", totalArticles);
  req.log.info("🐛 DEBUG - Sample article (first):", articles[0]);

  const totalPages = Math.ceil(totalArticles / limit);
  const currentPage = Math.floor(skip / limit) + 1;

  const response = {
    articles,
    totalArticles,
    totalPages,
    currentPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };

  req.log.info("🐛 DEBUG - Response structure:", response);

  res.status(200).json(response);
};

export const getSingleArticle = async (req, res) => {
  const parsed = getArticleSchema.safeParse(req.params);
  if (!parsed.success) {
    throw new AppError("Invalid article ID", 400, parsed.error.errors);
  }

  // Increment views atomically and fetch the updated article
  const article = await catchAndWrap(async () => {
    const updatedArticle = await Article.findByIdAndUpdate(
      parsed.data.articleId,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!updatedArticle) return null;

    // Populate comments with user data
    await updatedArticle.populate("comments.user", "name email");

    let populatedAuthor = null;
    if (
      updatedArticle.authorType === "User" ||
      updatedArticle.authorType === "user"
    ) {
      populatedAuthor = await User.findById(updatedArticle.author).select(
        "name email"
      );
    } else if (
      updatedArticle.authorType === "Company" ||
      updatedArticle.authorType === "company"
    ) {
      populatedAuthor = await Company.findById(updatedArticle.author).select(
        "name email"
      );
    }

    // Convert to plain object and add populated author
    const articleObj = updatedArticle.toObject();
    articleObj.author = populatedAuthor;

    return articleObj;
  }, "Failed to fetch article");

  if (!article) throw new AppError("Article not found", 404);
  res.status(200).json(article);
};

export const updateArticle = async (req, res) => {
  const parsed = updateArticleSchema.safeParse({
    params: req.params,
    body: req.body,
  });

  if (!parsed.success) {
    throw new AppError("Validation failed", 400, parsed.error.errors);
  }
  const { articleId } = parsed.data.params;
  const updateData = parsed.data.body;
  // Use company id if present, else fallback to user id
  const authorId = req.user.company ? req.user.company : req.user._id;
  req.log.info(
    "req.user._id:",
    req.user._id,
    "req.user.company:",
    req.user.company,
    "authorId used:",
    authorId
  );

  const article = await catchAndWrap(
    () =>
      Article.findOneAndUpdate(
        { _id: articleId, author: authorId },
        updateData,
        { new: true }
      ),
    "Failed to update article"
  );

  if (!article) throw new AppError("Article not found or unauthorized", 404);
  res.status(200).json(article);
};

export const deleteArticle = async (req, res) => {
  const parsed = getArticleSchema.safeParse(req.params);
  if (!parsed.success) {
    throw new AppError("Invalid article ID", 400, parsed.error.errors);
  }
  const authorId = req.user.company ? req.user.company : req.user._id;

  const deleted = await catchAndWrap(
    () =>
      Article.findOneAndDelete({
        _id: parsed.data.articleId,
        author: authorId,
      }),
    "Failed to delete article"
  );

  if (!deleted) throw new AppError("Article not found or unauthorized", 404);

  res.status(200).json({ message: "Article deleted successfully" });
};

export const toggleLike = async (req, res) => {
  const parsed = getArticleSchema.safeParse(req.params);
  if (!parsed.success) {
    throw new AppError("Invalid article ID", 400, parsed.error.errors);
  }

  const article = await catchAndWrap(
    () => Article.findById(parsed.data.articleId),
    "Failed to find article"
  );

  if (!article) throw new AppError("Article not found", 404);

  const userIdString = req.user._id.toString();
  const isLiked = article.likes.some(
    (like) => like.toString() === userIdString
  );

  if (isLiked) {
    // Remove like
    article.likes = article.likes.filter(
      (like) => like.toString() !== userIdString
    );
  } else {
    // Add like
    article.likes.push(req.user._id);
  }

  await article.save();

  res.status(200).json({
    message: isLiked ? "Article unliked" : "Article liked",
    likes: article.likes.length,
    isLiked: !isLiked,
  });
};

export const addComment = async (req, res) => {
  const parsed = getArticleSchema.safeParse(req.params);
  if (!parsed.success) {
    throw new AppError("Invalid article ID", 400, parsed.error.errors);
  }

  const { comment } = req.body;
  if (!comment || !comment.trim()) {
    throw new AppError("Comment is required", 400);
  }

  const article = await catchAndWrap(
    () => Article.findById(parsed.data.articleId),
    "Failed to find article"
  );

  if (!article) throw new AppError("Article not found", 404);

  const newComment = {
    user: req.user._id,
    comment: comment.trim(),
    createdAt: new Date(),
  };

  article.comments.push(newComment);
  await article.save();

  // Populate the new comment with user data
  await article.populate("comments.user", "name email");

  res.status(201).json({
    message: "Comment added successfully",
    comment: article.comments[article.comments.length - 1],
  });
};
