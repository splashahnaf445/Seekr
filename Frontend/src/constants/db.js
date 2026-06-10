export const DB = {
  users: [
    { id: "u1", name: "Admin User", uni_id: "ADM-001", email: "admin@uni.edu", password: "admin123", join_date: "2024-01-01", is_admin: true },
  ],
  items: [],
  claims: [],
  comments: [],
  messages: [],
  notifications: [],
};

let nextId = 100;
export const uid = () => `id_${nextId++}`;
