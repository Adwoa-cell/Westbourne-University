export function paginate(items, page, pageSize) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  return { data: items.slice(start, start + pageSize), meta: { page, pageSize, total, totalPages } };
}
