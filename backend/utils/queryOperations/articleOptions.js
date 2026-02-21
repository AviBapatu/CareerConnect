import { logger } from "../logger.js";
export const articleOptions = (query) => {
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    order = "desc",
    search,
    ...filters
  } = query;

  logger.info("🐛 DEBUG - articleOptions input query:", query);
  logger.info("🐛 DEBUG - articleOptions filters:", filters);

  // Convert page/limit to numbers
  const skip = (Number(page) - 1) * Number(limit);

  // Search logic (title + content)
  const searchFilter = search
    ? {
        $or: [
          { title: { $regex: search, $options: "i" } },
          { content: { $regex: search, $options: "i" } },
        ],
      }
    : {};

  // Tag filtering (e.g., ?tags=react,node)
  if (filters.tags) {
    filters.tags = {
      $in: filters.tags.split(",").map((tag) => tag.trim().toLowerCase()),
    };
  }

  // Handle status filter - include articles without status field (treat as published)
  if (filters.status === "published") {
    filters.$or = [
      { status: "published" },
      { status: { $exists: false } }, // Include articles without status field
    ];
    delete filters.status; // Remove the original status filter
  }

  const finalFilter = { ...filters, ...searchFilter };
  logger.info("🐛 DEBUG - Final filter being applied:", finalFilter);

  return {
    filter: finalFilter,
    skip,
    limit: Number(limit),
    sort: { [sortBy]: order === "asc" ? 1 : -1 },
  };
};
