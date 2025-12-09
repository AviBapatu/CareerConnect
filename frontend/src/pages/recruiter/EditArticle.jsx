import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Eye, FileText, Tag, Calendar, X } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { getArticleById, updateArticle, deleteArticle } from "@/api/articleApi";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const EditArticle = () => {
  const { articleId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
    tags: [],
  });
  const [newTag, setNewTag] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const categories = [
    "Interview Tips",
    "Resume Writing",
    "Career Development",
    "Industry Trends",
    "Job Search",
    "Networking",
    "Professional Skills",
    "Workplace Culture",
  ];

  // Fetch article data
  const {
    data: article,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["article", articleId],
    queryFn: () => getArticleById(articleId),
    enabled: !!articleId,
  });

  // Update article mutation
  const updateMutation = useMutation({
    mutationFn: (data) => {
      
      return updateArticle(articleId, data);
    },
    onSuccess: (data) => {
      
      queryClient.invalidateQueries(["article", articleId]);
      queryClient.invalidateQueries(["myArticles"]);
      toast.success("Article updated successfully!");
      navigate("/recruiter/my-articles");
    },
    onError: (error) => {
      console.error("[EditArticle] updateMutation onError", error);
      toast.error(error.response?.data?.message || "Failed to update article");
    },
  });

  // Delete article mutation
  const deleteMutation = useMutation({
    mutationFn: () => {
      
      return deleteArticle(articleId);
    },
    onSuccess: () => {
      
      queryClient.invalidateQueries(["myArticles"]);
      toast.success("Article deleted successfully!");
      navigate("/recruiter/my-articles");
    },
    onError: (error) => {
      console.error("[EditArticle] deleteMutation onError", error);
      toast.error(error.response?.data?.message || "Failed to delete article");
    },
  });

  // Set form data when article is loaded
  useEffect(() => {
    if (article) {
      
      // Normalize category to match one of the categories exactly
      const matchedCategory =
        categories.find(
          (cat) =>
            cat.trim().toLowerCase() ===
            (article.category || "").trim().toLowerCase()
        ) || "";
      setFormData({
        title: article.title || "",
        content: article.content || "",
        category: matchedCategory,
        tags: article.tags || [],
      });
    }
  }, [article]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, trimmedTag],
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    
    

    // Basic validation
    if (!formData.title.trim()) {
      console.warn("[EditArticle] Validation failed: title missing");
      toast.error("Please enter a title");
      return;
    }

    if (!formData.content.trim()) {
      console.warn("[EditArticle] Validation failed: content missing");
      toast.error("Please enter content");
      return;
    }

    if (!formData.category) {
      console.warn("[EditArticle] Validation failed: category missing");
      toast.error("Please select a category");
      return;
    }

    
    updateMutation.mutate(formData);
  };

  const handleBack = () => {
    navigate("/recruiter/my-articles");
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteArticle = async () => {
    setIsDeleting(true);
    try {
      await deleteArticle(articleId);
      toast.success("Article deleted successfully!");
      navigate("/recruiter/my-articles");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete article");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-200"></div>
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-900 border-t-transparent absolute inset-0"></div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-6">
            <FileText size={32} className="text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Article not found
          </h2>
          <p className="text-slate-600 mb-6">
            The article you're trying to edit doesn't exist or you don't have
            permission to edit it.
          </p>
          <Button
            onClick={handleBack}
            className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-medium"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to My Articles
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 py-12"
      style={{ fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif' }}
    >
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <Button
              onClick={handleBack}
              className="group flex items-center gap-2 px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-slate-200/60 text-slate-700 hover:bg-white hover:border-slate-300/60 rounded-xl font-medium transition-all duration-200"
            >
              <ArrowLeft
                size={16}
                className="transition-transform group-hover:-translate-x-0.5"
              />
              Back to My Articles
            </Button>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                onClick={() => setPreviewMode(!previewMode)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                  previewMode
                    ? "bg-slate-900 text-white"
                    : "bg-white/80 backdrop-blur-sm border border-slate-200/60 text-slate-700 hover:bg-white hover:border-slate-300/60"
                }`}
              >
                <Eye size={16} />
                {previewMode ? "Edit Mode" : "Preview"}
              </Button>
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-2">
            Edit Article
          </h1>
          <p className="text-slate-600 font-light text-lg">
            Update your article content and settings
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8">
            {previewMode ? (
              /* Preview Mode */
              <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl shadow-sm">
                <CardContent className="p-8">
                  {/* Preview Header */}
                  <div className="mb-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100/80 backdrop-blur-sm text-slate-700 border border-slate-200/60 rounded-full font-medium text-sm tracking-wide">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                        {formData.category || "General"}
                      </div>
                      <div className="text-sm text-slate-500 font-medium">
                        {Math.ceil((formData.content?.length || 0) / 1000)} min
                        read
                      </div>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight mb-4 tracking-tight">
                      {formData.title || "Article Title"}
                    </h1>

                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-6">
                        {formData.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100/80 text-slate-700 rounded-full text-sm font-medium"
                          >
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Preview Content */}
                  <div className="prose prose-xl max-w-none">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => (
                          <p className="mb-6 text-slate-700 leading-relaxed text-lg font-light">
                            {children}
                          </p>
                        ),
                        h1: ({ children }) => (
                          <h1 className="text-3xl font-bold text-slate-900 mb-6 mt-8">
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-2xl font-bold text-slate-900 mb-5 mt-7">
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-xl font-semibold text-slate-900 mb-4 mt-6">
                            {children}
                          </h3>
                        ),
                        strong: ({ children }) => (
                          <strong className="font-semibold text-slate-900">
                            {children}
                          </strong>
                        ),
                        em: ({ children }) => (
                          <em className="italic text-slate-700">{children}</em>
                        ),
                        code: ({ children }) => (
                          <code className="bg-slate-100 text-slate-800 px-2 py-1 rounded text-sm font-mono">
                            {children}
                          </code>
                        ),
                        pre: ({ children }) => (
                          <pre className="bg-slate-100 p-4 rounded-lg overflow-x-auto text-sm font-mono mb-6">
                            {children}
                          </pre>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-slate-300 pl-6 italic text-slate-600 mb-6">
                            {children}
                          </blockquote>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc pl-6 mb-6 space-y-2">
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal pl-6 mb-6 space-y-2">
                            {children}
                          </ol>
                        ),
                        li: ({ children }) => (
                          <li className="text-slate-700 leading-relaxed">
                            {children}
                          </li>
                        ),
                      }}
                    >
                      {formData.content ||
                        "Start writing your article content..."}
                    </ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Edit Mode */
              <form onSubmit={handleSubmit} className="space-y-6">
                <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl shadow-sm">
                  <CardHeader className="pb-6">
                    <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                      <FileText size={20} />
                      Article Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Title */}
                    <div className="space-y-3">
                      <Label
                        htmlFor="title"
                        className="text-sm font-semibold text-slate-700 tracking-wide"
                      >
                        Title *
                      </Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) =>
                          handleInputChange("title", e.target.value)
                        }
                        placeholder="Enter an engaging title for your article"
                        className="text-lg font-medium bg-slate-50/50 border-slate-200 focus:border-slate-300 focus:ring-0 rounded-xl py-3"
                        required
                      />
                    </div>

                    {/* Category */}
                    <div className="space-y-3">
                      <Label
                        htmlFor="category"
                        className="text-sm font-semibold text-slate-700 tracking-wide"
                      >
                        Category *
                      </Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) =>
                          handleInputChange("category", value)
                        }
                      >
                        <SelectTrigger className="bg-slate-50/50 border-slate-200 focus:border-slate-300 focus:ring-0 rounded-xl py-3">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem
                              key={category}
                              value={category}
                              className="py-3 px-4 hover:bg-slate-50"
                            >
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Content */}
                    <div className="space-y-3">
                      <Label
                        htmlFor="content"
                        className="text-sm font-semibold text-slate-700 tracking-wide"
                      >
                        Content *
                        <span className="font-normal text-xs text-slate-500 ml-2">
                          (Supports Markdown formatting)
                        </span>
                      </Label>
                      <Textarea
                        id="content"
                        value={formData.content}
                        onChange={(e) =>
                          handleInputChange("content", e.target.value)
                        }
                        placeholder="Write your article content here. You can use Markdown formatting..."
                        className="min-h-[400px] font-mono text-sm bg-slate-50/50 border-slate-200 focus:border-slate-300 focus:ring-0 rounded-xl resize-none"
                        required
                      />
                    </div>
                  </CardContent>
                </Card>
              </form>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Tags */}
            <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Tag size={18} />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Add a tag..."
                    className="flex-1 bg-slate-50/50 border-slate-200 focus:border-slate-300 focus:ring-0 rounded-lg text-sm"
                  />
                  <Button
                    type="button"
                    onClick={handleAddTag}
                    size="sm"
                    className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg"
                  >
                    Add
                  </Button>
                </div>

                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-red-600 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            {!previewMode && (
              <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl shadow-sm">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <Button
                      type="submit"
                      onClick={handleSubmit}
                      disabled={updateMutation.isPending}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-medium shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      {updateMutation.isPending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      ) : (
                        <>
                          <Save size={16} />
                          Update Article
                        </>
                      )}
                    </Button>

                    <ConfirmDialog
                      open={deleteDialogOpen}
                      onOpenChange={setDeleteDialogOpen}
                      onConfirm={handleDeleteArticle}
                      title="Delete Article?"
                      description="Are you sure you want to delete this article? This action cannot be undone."
                    >
                      <Button
                        type="button"
                        onClick={handleDelete}
                        className="w-full bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-medium shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2"
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        ) : (
                          <>
                            <X size={16} />
                            Delete Article
                          </>
                        )}
                      </Button>
                    </ConfirmDialog>

                    <div className="text-xs text-slate-500 text-center">
                      Your changes will be saved and the article will remain
                      published
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Article Info */}
            {article && (
              <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <Calendar size={18} />
                    Article Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Status:</span>
                    <Badge
                      variant={
                        article.status === "published" ? "default" : "secondary"
                      }
                      className={`${
                        article.status === "published"
                          ? "bg-green-100 text-green-800 border-green-200"
                          : "bg-yellow-100 text-yellow-800 border-yellow-200"
                      } font-medium`}
                    >
                      {article.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Created:</span>
                    <span className="text-slate-900 font-medium">
                      {new Date(article.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Last Updated:</span>
                    <span className="text-slate-900 font-medium">
                      {new Date(article.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Views:</span>
                    <span className="text-slate-900 font-medium">
                      {(article.views || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Likes:</span>
                    <span className="text-slate-900 font-medium">
                      {article.likes?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Comments:</span>
                    <span className="text-slate-900 font-medium">
                      {article.comments?.length || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditArticle;
