// Pre-defined categories with colors and icons
export const CATEGORIES = {
  electronics: {
    id: "electronics",
    name: "Electronics",
    icon: "📱",
    color: "#3B82F6",
    bg: "#EFF6FF",
    darkBg: "#1E3A8A"
  },
  documents: {
    id: "documents",
    name: "Documents",
    icon: "📄",
    color: "#8B5CF6",
    bg: "#F5F3FF",
    darkBg: "#3F0F63"
  },
  keys: {
    id: "keys",
    name: "Keys",
    icon: "🔑",
    color: "#FBBF24",
    bg: "#FFFBEB",
    darkBg: "#78350F"
  },
  clothing: {
    id: "clothing",
    name: "Clothing",
    icon: "👔",
    color: "#EC4899",
    bg: "#FDF2F8",
    darkBg: "#500724"
  },
  accessories: {
    id: "accessories",
    name: "Accessories",
    icon: "👜",
    color: "#14B8A6",
    bg: "#F0FDFA",
    darkBg: "#134E4A"
  },
  books: {
    id: "books",
    name: "Books",
    icon: "📚",
    color: "#F97316",
    bg: "#FFF7ED",
    darkBg: "#7C2D12"
  },
  sports: {
    id: "sports",
    name: "Sports",
    icon: "⚽",
    color: "#06B6D4",
    bg: "#F0F9FA",
    darkBg: "#164E63"
  },
  other: {
    id: "other",
    name: "Other",
    icon: "📦",
    color: "#6B7280",
    bg: "#F9FAFB",
    darkBg: "#1F2937"
  }
};

export const getCategoryList = () => Object.values(CATEGORIES);

export const getCategoryById = (id) => CATEGORIES[id] || CATEGORIES.other;
