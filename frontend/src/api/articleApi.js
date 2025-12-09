import api from "@/lib/axios";

// Get all articles with optional filters
export const getArticles = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();

    if (params.search) queryParams.append("search", params.search);
    if (params.category) queryParams.append("category", params.category);
    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);
    if (params.status) queryParams.append("status", params.status);
    if (params.author) queryParams.append("author", params.author);

    
    

    const response = await api.get(`/article?${queryParams.toString()}`);

    
    
    

    return response.data;
  } catch (error) {
    console.error("❌ Error fetching articles:", error);
    console.error("❌ Error details:", error.response?.data);
    throw error;
  }
};

// Get single article by ID
export const getArticleById = async (articleId) => {
  try {
    const response = await api.get(`/article/${articleId}`);
    
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching article:", error);
    throw error;
  }
};

// Create new article
export const createArticle = async (articleData) => {
  try {
    const response = await api.post("/article", articleData);
    
    return response.data;
  } catch (error) {
    console.error("❌ Error creating article:", error);
    throw error;
  }
};

// Update article
export const updateArticle = async (articleId, articleData) => {
  try {
    const response = await api.patch(`/article/${articleId}`, articleData);
    
    return response.data;
  } catch (error) {
    console.error("❌ Error updating article:", error);
    throw error;
  }
};

// Delete article
export const deleteArticle = async (articleId) => {
  try {
    const response = await api.delete(`/article/${articleId}`);
    
    return response.data;
  } catch (error) {
    console.error("❌ Error deleting article:", error);
    throw error;
  }
};

// Like/unlike article
export const toggleArticleLike = async (articleId) => {
  try {
    const response = await api.post(`/article/${articleId}/like`);
    
    return response.data;
  } catch (error) {
    console.error("❌ Error toggling article like:", error);
    throw error;
  }
};

// Add comment to article
export const addArticleComment = async (articleId, commentData) => {
  try {
    const response = await api.post(
      `/article/${articleId}/comment`,
      commentData
    );
    
    return response.data;
  } catch (error) {
    console.error("❌ Error adding comment:", error);
    throw error;
  }
};

// Get article comments
export const getArticleComments = async (articleId) => {
  try {
    const response = await api.get(`/article/${articleId}/comments`);
    
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching comments:", error);
    throw error;
  }
};

// Update article status (published, draft, archived)
export const updateArticleStatus = async (articleId, status) => {
  try {
    const response = await api.patch(`/article/${articleId}/status`, {
      status,
    });
    
    return response.data;
  } catch (error) {
    console.error("❌ Error updating article status:", error);
    throw error;
  }
};

// Get trending articles
export const getTrendingArticles = async (limit = 5) => {
  try {
    const response = await api.get(`/article/trending?limit=${limit}`);
    
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching trending articles:", error);
    throw error;
  }
};

// Get articles by category
export const getArticlesByCategory = async (category, limit = 10) => {
  try {
    const response = await api.get(
      `/article/category/${category}?limit=${limit}`
    );
    
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching articles by category:", error);
    throw error;
  }
};

// Search articles
export const searchArticles = async (query, filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append("q", query);

    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });

    const response = await api.get(`/article/search?${queryParams.toString()}`);
    
    return response.data;
  } catch (error) {
    console.error("❌ Error searching articles:", error);
    throw error;
  }
};

// Toggle like on article
export const toggleLike = async (articleId) => {
  try {
    const response = await api.post(`/article/${articleId}/like`);
    
    return response.data;
  } catch (error) {
    console.error("❌ Error toggling article like:", error);
    throw error;
  }
};

// Get user's own articles
export const getMyArticles = async () => {
  try {
    const response = await api.get("/article/my");
    
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching my articles:", error);
    throw error;
  }
};

// Add comment to article
export const addComment = async (articleId, commentData) => {
  try {
    const response = await api.post(
      `/article/${articleId}/comment`,
      commentData
    );
    
    return response.data;
  } catch (error) {
    console.error("❌ Error adding comment:", error);
    throw error;
  }
};

// Verify signup 2FA OTP
export const verifySignup2FA = async (userId, otp) => {
  const response = await api.post("/auth/verify-signup-2fa", { userId, otp });
  return response.data;
};
